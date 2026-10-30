import type { EmailOtpType, Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { PassageColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  completeSupabaseAuth,
  hasEmailIdentity,
  isEmailConfirmed,
} from '@/lib/auth/complete-auth';
import { routeForOnboardingStatus } from '@/lib/auth/onboarding-routing';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const INITIAL_URL_TIMEOUT_MS = 4_000;
const SUPABASE_CALLBACK_TIMEOUT_MS = 10_000;
const SESSION_FALLBACK_TIMEOUT_MS = 4_000;
const PROFILE_FINALISATION_TIMEOUT_MS = 10_000;

type CallbackValues = {
  accessToken: string | null;
  code: string | null;
  email: string | null;
  errorDescription: string | null;
  flow: string | null;
  refreshToken: string | null;
  tokenHash: string | null;
  type: string | null;
};

type NavigationFallback = {
  body: string;
  destination: Href;
};

class AuthCallbackTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthCallbackTimeoutError';
  }
}

function withTimeout<T>(operation: PromiseLike<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new AuthCallbackTimeoutError(message)), timeoutMs);

    Promise.resolve(operation).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

function readCallbackValues(url: string): CallbackValues {
  const parsed = new URL(url);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const get = (name: string) => hash.get(name) ?? parsed.searchParams.get(name);

  return {
    accessToken: get('access_token'),
    code: get('code'),
    email: get('email'),
    errorDescription: get('error_description') ?? get('error'),
    flow: get('flow'),
    refreshToken: get('refresh_token'),
    tokenHash: get('token_hash'),
    type: get('type'),
  };
}

async function sessionFromCallback(values: CallbackValues): Promise<Session | null> {
  if (values.errorDescription) throw new Error(values.errorDescription);

  if (values.accessToken && values.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: values.accessToken,
      refresh_token: values.refreshToken,
    });
    if (error) throw error;
    return data.session;
  }

  if (values.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(values.code);
    if (error) throw error;
    return data.session;
  }

  if (values.tokenHash && values.type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: values.tokenHash,
      type: values.type as EmailOtpType,
    });
    if (error) throw error;
    return data.session;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

function isConfirmedEmailSession(session: Session | null): boolean {
  return Boolean(session && hasEmailIdentity(session.user) && isEmailConfirmed(session.user));
}

function sessionForTokenUser(
  values: CallbackValues,
  storedSession: Session | null,
  user: User
): Session | null {
  if (storedSession) return { ...storedSession, user };
  if (!values.accessToken || !values.refreshToken) return null;

  // getUser(accessToken) has just validated this token with Supabase. This lets
  // the app adopt it even if setSession's local storage write was what stalled.
  return {
    access_token: values.accessToken,
    expires_at: Math.floor(Date.now() / 1_000) + 3_600,
    expires_in: 3_600,
    refresh_token: values.refreshToken,
    token_type: 'bearer',
    user,
  };
}

/** Recover a link that was already used successfully or timed out after confirmation. */
async function findConfirmedSession(values: CallbackValues): Promise<Session | null> {
  let storedSession: Session | null = null;

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_FALLBACK_TIMEOUT_MS,
      'Checking the confirmed session timed out.'
    );
    if (!error) storedSession = data.session;
  } catch {
    // The direct access-token check below can still recover an implicit link.
  }

  if (isConfirmedEmailSession(storedSession)) return storedSession;

  const accessToken = values.accessToken ?? storedSession?.access_token;
  if (!accessToken) return null;

  try {
    const { data, error } = await withTimeout(
      supabase.auth.getUser(accessToken),
      SESSION_FALLBACK_TIMEOUT_MS,
      'Checking the confirmed user timed out.'
    );
    if (error || !hasEmailIdentity(data.user) || !isEmailConfirmed(data.user)) return null;
    return sessionForTokenUser(values, storedSession, data.user);
  } catch {
    return null;
  }
}

function isSignupCallback(values: CallbackValues, session: Session): boolean {
  return (
    values.type === 'signup' ||
    values.flow === 'signup' ||
    (!values.type && hasEmailIdentity(session.user) && isEmailConfirmed(session.user))
  );
}

export default function AuthCallback() {
  const router = useRouter();
  // Unlike the deprecated useURL(), this reads Expo's retained native linking
  // URL synchronously. That matters when the app is already open: Expo Router
  // can mount this route after the one-shot React Native URL event has fired.
  const currentUrl = Linking.useLinkingURL();
  const mountedRef = useRef(true);
  const processingUrlRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [navigationFallback, setNavigationFallback] = useState<NavigationFallback | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      let url: string | null = null;

      try {
        url =
          currentUrl ??
          (await withTimeout(
            Linking.getInitialURL(),
            INITIAL_URL_TIMEOUT_MS,
            'The confirmation link could not be read in time.'
          ));
      } catch (error) {
        // useLinkingURL() may already have given a second effect ownership of the URL.
        if (!mountedRef.current || processingUrlRef.current) return;
        setErrorMessage(
          error instanceof Error ? error.message : 'The confirmation link could not be read.'
        );
        setIsLoading(false);
        return;
      }

      if (!mountedRef.current) return;
      if (!url) {
        if (processingUrlRef.current) return;
        setErrorMessage('The confirmation link is missing. Please open it again from your email.');
        setIsLoading(false);
        return;
      }

      // On a cold launch, getInitialURL() and useLinkingURL() can yield the same
      // URL in adjacent renders. The first claimant must stay alive; cancelling
      // it and skipping the duplicate was the permanent-spinner race.
      if (processingUrlRef.current === url) return;
      processingUrlRef.current = url;
      const runId = ++runIdRef.current;
      const isCurrentRun = () => mountedRef.current && runIdRef.current === runId;

      setErrorMessage('');
      setNavigationFallback(null);
      setIsLoading(true);

      try {
        const values = readCallbackValues(url);
        let session: Session | null = null;
        let callbackError: unknown = null;

        try {
          session = await withTimeout(
            sessionFromCallback(values),
            SUPABASE_CALLBACK_TIMEOUT_MS,
            'Confirming the email timed out.'
          );
        } catch (error) {
          callbackError = error;
        }

        if (!isCurrentRun()) return;

        // An expired/reused link can still have created a confirmed session on
        // its first opening. A stale local user is refreshed before giving up.
        const requestedSignup = values.type === 'signup' || values.flow === 'signup';
        if (!session || (requestedSignup && !isConfirmedEmailSession(session))) {
          session = (await findConfirmedSession(values)) ?? session;
        }

        if (!isCurrentRun()) return;
        if (!session) {
          throw callbackError ?? new Error('The confirmation link did not create a session.');
        }

        const signupCallback = isSignupCallback(values, session);
        const recoveryCallback = values.type === 'recovery' || values.flow === 'recovery';

        if (signupCallback && !isConfirmedEmailSession(session)) {
          const destination = {
            pathname: '/verify-email',
            params: { email: values.email ?? session.user.email ?? '' },
          } as Href;
          setNavigationFallback({
            body: 'This email still needs confirmation. Return to the verification screen.',
            destination,
          });
          router.replace(destination);
          return;
        }

        if (recoveryCallback) {
          // M-7: pass only a flow marker, not the access token. The recovery
          // session is already set on the Supabase client above; the
          // change-password screen reads the token from there at submit time,
          // so it never lands in navigation state or screen analytics.
          const destination = {
            pathname: '/change-password',
            params: { flow: 'recovery' },
          } as Href;
          setNavigationFallback({
            body: 'The recovery link is ready. Continue to choose a new password.',
            destination,
          });
          router.replace(destination);
          return;
        }

        if (signupCallback) {
          // Supabase confirmation is authoritative. Profile projection and
          // guest import are retryable and must not hide a confirmed account.
          void withTimeout(
            completeSupabaseAuth(session),
            PROFILE_FINALISATION_TIMEOUT_MS,
            'Confirmed account setup timed out.'
          ).catch((error: unknown) => {
            console.warn('[auth] confirmed account setup remains pending', error);
          });

          const destination = {
            pathname: '/verified',
            params: { confirmed: '1' },
          } as Href;
          setNavigationFallback({
            body: 'Your email is confirmed. Continue to your account.',
            destination,
          });
          router.replace(destination);
          return;
        }

        const me = await withTimeout(
          completeSupabaseAuth(session),
          PROFILE_FINALISATION_TIMEOUT_MS,
          'Finishing sign in timed out.'
        );
        if (!isCurrentRun()) return;
        await routeForOnboardingStatus(router, me);
      } catch (error) {
        if (!isCurrentRun()) return;
        processingUrlRef.current = null;
        setNavigationFallback(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'This confirmation link could not be completed.'
        );
      } finally {
        if (isCurrentRun()) setIsLoading(false);
      }
    })();
  }, [currentUrl, retryCount, router]);

  const retry = () => {
    processingUrlRef.current = null;
    setErrorMessage('');
    setIsLoading(true);
    setRetryCount((count) => count + 1);
  };

  return (
    <OnboardingScaffold contentContainerStyle={styles.content} scroll={false}>
      {isLoading ? (
        <ActivityIndicator color={PassageColors.accent} size={'large'} />
      ) : errorMessage ? (
        <>
          <Text style={styles.heading}>We couldn&apos;t confirm that link</Text>
          <Text accessibilityLiveRegion={'polite'} style={styles.body}>{errorMessage}</Text>
          <View style={styles.actions}>
            <OnboardingContinueButton
              label={'Try again'}
              onPress={retry}
              style={styles.primaryButton}
            />
          </View>
          <Pressable
            accessibilityRole={'link'}
            hitSlop={8}
            onPress={() => router.replace('/login')}
            style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}>
            <Text style={styles.signInLink}>Return to sign in</Text>
          </Pressable>
        </>
      ) : navigationFallback ? (
        <>
          <Text style={styles.heading}>Ready to continue</Text>
          <Text style={styles.body}>{navigationFallback.body}</Text>
          <View style={styles.actions}>
            <OnboardingContinueButton
              label={'Continue'}
              onPress={() => router.replace(navigationFallback.destination)}
              style={styles.primaryButton}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.heading}>We couldn&apos;t confirm that link</Text>
          <Text style={styles.body}>Please return to sign in and try again.</Text>
          <View style={styles.actions}>
            <OnboardingContinueButton
              label={'Return to sign in'}
              onPress={() => router.replace('/login')}
              style={styles.primaryButton}
            />
          </View>
        </>
      )}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  actions: {
    marginTop: 30,
    maxWidth: 440,
    width: '100%',
  },
  body: {
    ...Typography.body,
    color: PassageColors.textSecondary,
    marginTop: 10,
    maxWidth: 350,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  heading: {
    ...Typography.screenHeading,
    color: PassageColors.textPrimary,
    maxWidth: 440,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
  primaryButton: {
    width: '100%',
  },
  signInButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 6,
  },
  signInLink: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
});
