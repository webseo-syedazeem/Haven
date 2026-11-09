import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { PassageColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { forgotPassword } from '@/lib/passage-api';
import { safeGoBack } from '@/lib/navigation';
import { openEmailInbox } from '@/lib/open-email-inbox';

const background = require('@/assets/images/auth-verify-letterbox-rain-v4.webp');
const RESEND_COOLDOWN_SECONDS = 30;

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default function ResetEmailSentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string | string[] }>();
  const email = firstParam(params.email).trim().toLowerCase();
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [message, setMessage] = useState('');
  const [openingMail, setOpeningMail] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const openMailApp = async () => {
    if (openingMail) return;
    setOpeningMail(true);
    setMessage('');
    try {
      if (!(await openEmailInbox(email))) {
        setMessage('No email app is available. Please open your inbox manually.');
      }
    } catch {
      setMessage('We could not open your email app. Please open it manually.');
    } finally {
      setOpeningMail(false);
    }
  };

  const resendResetLink = async () => {
    if (!email || cooldown > 0 || resending) return;
    setResending(true);
    setMessage('');
    try {
      await forgotPassword(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setMessage('A new password reset email is on its way.');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'We could not resend the password reset email.'
      );
    } finally {
      setResending(false);
    }
  };

  const changeEmail = () => {
    router.replace({
      pathname: '/reset-password',
      params: email ? { email } : {},
    } as never);
  };

  const resendLabel = resending
    ? 'Sending…'
    : cooldown > 0
      ? `Send another link (${cooldown}s)`
      : 'Send another link';

  return (
    <OnboardingScaffold
      backgroundImage={background}
      backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
      contentContainerStyle={styles.content}
      onBack={() => safeGoBack(router, '/reset-password')}>
      <Text style={styles.heading}>Check your inbox</Text>
      <Text style={styles.body}>
        We&apos;ve sent a password reset link to{' '}
        <Text style={styles.email}>{email || 'your email address'}</Text>. Open it to choose a
        new password.
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
        onPress={() => void resendResetLink()}
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
        The reset link will bring you back to Passage to choose a new password.
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
    maxWidth: 310,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 10,
    maxWidth: 340,
    textAlign: 'center',
  },
  changeButton: {
    marginTop: 18,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  changeLink: {
    color: PassageColors.textPrimary,
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
    color: PassageColors.textPrimary,
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
    color: PassageColors.accent,
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
