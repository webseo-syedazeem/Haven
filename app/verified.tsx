import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { hasEmailIdentity, isEmailConfirmed } from '@/lib/auth/complete-auth';
import { routeAfterSignIn } from '@/lib/auth/onboarding-routing';
import { resetToMainApp } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

const background = require('@/assets/images/auth-verified-clearing-realistic.webp');

export default function VerifiedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ confirmed?: string | string[] }>();
  const confirmedByCallback =
    (Array.isArray(params.confirmed) ? params.confirmed[0] : params.confirmed) === '1';
  const [checking, setChecking] = useState(!confirmedByCallback);
  const [checkError, setCheckError] = useState('');
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (confirmedByCallback) {
      setChecking(false);
      return;
    }

    let active = true;
    let finished = false;
    const timeout = setTimeout(() => {
      if (!active || finished) return;
      finished = true;
      setCheckError('We could not check your confirmed session. Please sign in to continue.');
      setChecking(false);
    }, 4_000);

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active || finished) return;
        finished = true;
        if (
          error ||
          !data.session ||
          !hasEmailIdentity(data.session.user) ||
          !isEmailConfirmed(data.session.user)
        ) {
          setCheckError('Your confirmed session is unavailable. Please sign in to continue.');
        }
        setChecking(false);
      })
      .catch(() => {
        if (!active || finished) return;
        finished = true;
        setCheckError('We could not check your confirmed session. Please sign in to continue.');
        setChecking(false);
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [confirmedByCallback]);

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
      <OnboardingScaffold
        backgroundImage={background}
        backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
        contentContainerStyle={styles.content}
        scroll={false}>
        <ActivityIndicator color={HalcyonColors.accent} size="small" />
      </OnboardingScaffold>
    );
  }

  if (checkError) {
    return (
      <OnboardingScaffold
        backgroundImage={background}
        backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
        contentContainerStyle={styles.content}
        scroll={false}>
        <Text style={styles.heading}>Your email is confirmed</Text>
        <Text accessibilityLiveRegion="polite" style={styles.body}>
          {checkError}
        </Text>
        <OnboardingContinueButton
          label="Continue to sign in"
          onPress={() => router.replace('/login')}
          style={styles.primaryButton}
        />
      </OnboardingScaffold>
    );
  }

  return (
    <OnboardingScaffold
      backgroundImage={background}
      backgroundOverlayColor="rgba(7, 11, 16, 0.30)"
      contentContainerStyle={styles.content}
      scroll={false}>
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
    color: 'rgba(255, 255, 255, 0.72)',
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
