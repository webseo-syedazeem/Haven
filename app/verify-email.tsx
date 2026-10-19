import type { Session } from '@supabase/supabase-js';
import { useIsFocused } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  completeSupabaseAuth,
  hasEmailIdentity,
  isEmailConfirmed,
} from '@/lib/auth/complete-auth';
import { safeGoBack } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

const background = require('@/assets/images/auth-verify-meadow-realistic.webp');

const RESEND_COOLDOWN_SECONDS = 30;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = firstParam(params.email).trim().toLowerCase();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [message, setMessage] = useState('');
  const [openingMail, setOpeningMail] = useState(false);
  const [resending, setResending] = useState(false);
  const finalisingRef = useRef(false);

  const acceptConfirmedSession = useCallback(
    (session: Session | null) => {
      const sessionEmail = session?.user.email?.trim().toLowerCase();
      if (
        !session ||
        !email ||
        sessionEmail !== email ||
        !hasEmailIdentity(session.user) ||
        !isEmailConfirmed(session.user) ||
        !isFocusedRef.current ||
        finalisingRef.current
      ) {
        return;
      }

      finalisingRef.current = true;
      setMessage('Email confirmed. Finishing your account…');
      // Confirmation is authoritative; profile projection is retryable setup
      // and must never hold this screen on a finishing message forever.
      void completeSupabaseAuth(session).catch(() => undefined);
      router.replace({ pathname: '/verified', params: { confirmed: '1' } } as Href);
    },
    [email, router]
  );

  const checkSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setMessage(error.message);
      return;
    }
    acceptConfirmedSession(data.session);
  }, [acceptConfirmedSession]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      isFocusedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void checkSession();
    // The auth callback route exclusively owns deep-link completion. Listening
    // here as well caused both mounted routes to replace with /verified, making
    // the success screen appear twice. This one mount-time check only covers a
    // session that was already confirmed before this screen opened.
  }, [checkSession]);

  const openMailApp = async () => {
    if (openingMail) return;
    setOpeningMail(true);
    setMessage('');
    try {
      const candidates = Platform.OS === 'ios' ? ['message://', 'mailto:'] : ['mailto:'];
      let opened = false;
      for (const url of candidates) {
        if (await Linking.canOpenURL(url)) {
          await Linking.openURL(url);
          opened = true;
          break;
        }
      }
      if (!opened) {
        setMessage('No email app is available on this device.');
      }
    } catch {
      setMessage('We could not open your email app. Please open it manually.');
    } finally {
      setOpeningMail(false);
    }
  };

  const resendEmail = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setMessage('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: Linking.createURL('auth/callback', {
            queryParams: { flow: 'signup' },
          }),
        },
      });
      if (error) throw error;
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage('A new verification email is on its way.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'We could not resend the verification email.'
      );
    } finally {
      setResending(false);
    }
  };

  const changeEmail = () => {
    router.replace({
      pathname: '/create-account',
      params: email ? { email } : {},
    } as never);
  };

  const resendLabel = resending
    ? 'Resending…'
    : cooldown > 0
      ? 'Resend email (' + cooldown + 's)'
      : 'Resend email';

  return (
    <OnboardingScaffold
      backgroundImage={background}
      backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
      contentContainerStyle={styles.content}
      onBack={() => safeGoBack(router, '/create-account')}>
      <Text style={styles.heading}>Check your inbox</Text>
      <Text style={styles.body}>
        We&apos;ve sent a verification link to{' '}
        <Text style={styles.email}>{email || 'your email address'}</Text>. Tap it to confirm your
        account.
      </Text>

      <OnboardingContinueButton
        label="Open email app"
        loading={openingMail}
        onPress={() => void openMailApp()}
        style={styles.primaryButton}
      />

      <Pressable
        accessibilityRole="button"
        disabled={!email || cooldown > 0 || resending}
        hitSlop={8}
        onPress={() => void resendEmail()}
        style={({ pressed }) => [
          styles.linkButton,
          (!email || cooldown > 0 || resending) && styles.linkDisabled,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.linkText}>{resendLabel}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={changeEmail}
        style={({ pressed }) => [styles.changeButton, pressed && styles.pressed]}>
        <Text style={styles.changeText}>
          Wrong email? <Text style={styles.changeLink}>Change it</Text>
        </Text>
      </Pressable>

      {message ? (
        <Text accessibilityLiveRegion="polite" style={styles.message}>
          {message}
        </Text>
      ) : null}
      <Text style={styles.automatic}>
        Passage will continue automatically when the confirmed link returns to the app.
      </Text>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  automatic: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 24,
    maxWidth: 300,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 10,
    maxWidth: 330,
    textAlign: 'center',
  },
  changeButton: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  changeLink: {
    color: HalcyonColors.textPrimary,
    textDecorationLine: 'underline',
  },
  changeText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 46,
  },
  email: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
  },
  heading: {
    ...Typography.screenHeading,
    color: HalcyonColors.textPrimary,
    textAlign: 'center',
  },
  linkButton: {
    marginTop: 17,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  linkDisabled: { opacity: 0.58 },
  linkText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    textDecorationLine: 'underline',
  },
  message: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 16,
    maxWidth: 310,
    textAlign: 'center',
  },
  pressed: { opacity: 0.66 },
  primaryButton: {
    marginTop: 30,
    maxWidth: 390,
  },
});
