import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, View } from 'react-native';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { hasEmailIdentity, isEmailConfirmed } from '@/lib/auth/complete-auth';
import { migrateGuestOnboardingAfterAuth } from '@/lib/onboarding';
import { resetToMainApp } from '@/lib/navigation';
import { supabase } from '@/lib/supabase';

export default function VerifiedScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [continuing, setContinuing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');
    try {
      // A3/callback already attempts this. Calling again is intentional: the
      // local migration is idempotent and a network failure stays pending.
      await migrateGuestOnboardingAfterAuth();
      resetToMainApp(router);
    } catch {
      setErrorMessage(
        'Your email is confirmed, but your Passage preferences still need to be saved. Check your connection and try again.'
      );
      setContinuing(false);
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
      <View style={styles.topLine} />
      <View style={styles.iconCircle}>
        <Ionicons color={HalcyonColors.accent} name="checkmark" size={34} />
      </View>
      <Text style={styles.heading}>You&apos;re all set</Text>
      <Text style={styles.body}>Your email is confirmed.</Text>
      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {errorMessage}
        </Text>
      ) : null}
      <OnboardingContinueButton
        loading={continuing}
        onPress={() => void continueIntoApp()}
        style={styles.primaryButton}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 62,
  },
  error: {
    color: '#DFA196',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 18,
    maxWidth: 320,
    textAlign: 'center',
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 35,
    fontWeight: '400',
    lineHeight: 40,
    marginTop: 27,
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: HalcyonColors.accent,
    borderRadius: 34,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    shadowColor: HalcyonColors.accent,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    width: 68,
  },
  primaryButton: {
    marginTop: 34,
    maxWidth: 390,
  },
  topLine: {
    backgroundColor: HalcyonColors.accent,
    height: 2,
    opacity: 0.92,
    position: 'absolute',
    top: 18,
    width: 28,
  },
});
