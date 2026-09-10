import type { EmailOtpType, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  completeSupabaseAuth,
  hasEmailIdentity,
  isEmailConfirmed,
} from '@/lib/auth/complete-auth';
import { routeForOnboardingStatus } from '@/lib/auth/onboarding-routing';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

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

export default function AuthCallback() {
  const router = useRouter();
  const currentUrl = Linking.useURL();
  const handledUrlRef = useRef<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    void (async () => {
      const url = currentUrl ?? (await Linking.getInitialURL());
      if (!active || !url || handledUrlRef.current === url) return;
      handledUrlRef.current = url;

      try {
        const values = readCallbackValues(url);
        const session = await sessionFromCallback(values);
        if (!active) return;
        if (!session) throw new Error('The confirmation link did not create a session.');

        const isEmailIdentity = hasEmailIdentity(session.user);
        const isSignupCallback =
          values.type === 'signup' ||
          values.flow === 'signup' ||
          (!values.type && isEmailIdentity && isEmailConfirmed(session.user));
        const isRecoveryCallback =
          values.type === 'recovery' || values.flow === 'recovery';

        if (isSignupCallback && !isEmailConfirmed(session.user)) {
          router.replace({
            pathname: '/verify-email',
            params: { email: values.email ?? session.user.email ?? '' },
          } as never);
          return;
        }

        // Password recovery only needs the real Supabase access token passed to
        // the reset endpoint. Do not let an unrelated guest-profile import
        // delay or block the user from choosing a new password.
        if (isRecoveryCallback) {
          router.replace({
            pathname: '/change-password',
            params: { access_token: session.access_token },
          } as never);
          return;
        }

        const me = await completeSupabaseAuth(session);
        if (!active) return;

        if (isSignupCallback) {
          router.replace('/verified' as Href);
          return;
        }

        routeForOnboardingStatus(router, me);
      } catch (error) {
        if (!active) return;
        handledUrlRef.current = null;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'This confirmation link could not be completed.'
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUrl, router]);

  return (
    <View style={styles.screen}>
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>We couldn&apos;t confirm that link</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace('/login')}
            style={({ pressed }) => [styles.errorButton, pressed && styles.pressed]}>
            <Text style={styles.errorButtonLabel}>Return to sign in</Text>
          </Pressable>
        </View>
      ) : (
        <ActivityIndicator color={HalcyonColors.accent} size="large" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  errorBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  errorButton: {
    borderColor: HalcyonColors.border,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  errorButtonLabel: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  errorCard: {
    alignItems: 'center',
    maxWidth: 330,
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 29,
    lineHeight: 34,
    textAlign: 'center',
  },
  pressed: { opacity: 0.7 },
  screen: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.background,
    flex: 1,
    justifyContent: 'center',
  },
});
