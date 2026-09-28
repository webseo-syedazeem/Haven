import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { hasEmailIdentity, isEmailConfirmed } from '@/lib/auth/complete-auth';
import { routeAfterSignIn } from '@/lib/auth/onboarding-routing';
import { resetToMainApp } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

export default function VerifiedScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (
        !data.session ||
        !hasEmailIdentity(data.session.user) ||
        !isEmailConfirmed(data.session.user)
      ) {
        router.replace('/login');
        return;
      }
      setChecking(false);
    });
    return () => {
      active = false;
    };
  }, [router]);

  const continueIntoApp = async () => {
    if (continuing) return;
    setContinuing(true);
    try {
      // Email signup is account-first: after verification, a new profile starts
      // (or resumes) onboarding; a profile that already completed it enters Home.
      await routeAfterSignIn(router);
    } catch (error) {
      console.warn('[auth] post-verification setup failed; continuing to the app', error);
      resetToMainApp(router);
    }
  };

  if (checking) {
    return (
      <OnboardingScaffold contentContainerStyle={styles.content} scroll={false}>
        <ActivityIndicator color={HalcyonColors.accent} size="small" />
      </OnboardingScaffold>
    );
  }

  return (
    <OnboardingScaffold contentContainerStyle={styles.content} scroll={false}>
      <Text style={styles.heading}>You&apos;re all set</Text>
      <Text style={styles.body}>Your email is confirmed.</Text>
      <OnboardingContinueButton
        label="Continue"
        loading={continuing}
        onPress={() => void continueIntoApp()}
        style={styles.primaryButton}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    marginTop: 8,
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
