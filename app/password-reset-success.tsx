import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { Typography } from '@/constants/design';

const background = require('@/assets/images/auth-verified-clearing-realistic.webp');

export default function PasswordResetSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  return (
    <OnboardingScaffold
      backgroundImage={background}
      backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
      contentContainerStyle={styles.content}
      scroll={false}>
      <Text style={styles.heading}>You&apos;re all set</Text>
      <Text style={styles.body}>
        Your password has been updated. Log in with your new password to continue.
      </Text>
      <OnboardingContinueButton
        label="Log in"
        onPress={() => router.replace('/login')}
        style={styles.primaryButton}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 8,
    maxWidth: 340,
    textAlign: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 62,
  },
  heading: {
    ...Typography.screenHeading,
    textAlign: 'center',
  },
  primaryButton: {
    marginTop: 34,
    maxWidth: 390,
  },
});
