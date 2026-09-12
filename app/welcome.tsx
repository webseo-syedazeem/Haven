import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BackHandler, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/AuthButton';
import { LegalDisclaimer } from '@/components/LegalDisclaimer';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
import { signInWithGoogle } from '@/lib/google-auth';
import {
  getGuestOnboardingAnswers,
  getOnboardingRecommendations,
  getOnboardingRecommendationsQueryKey,
  isGuestOnboardingComplete,
  isGuestOnboardingReady,
  markGuestOnboardingComplete,
  migrateGuestOnboardingAfterAuth,
} from '@/lib/onboarding';
import { resetToMainApp, resetToMainPlayer } from '@/lib/navigation';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

const appleIcon = require('@/assets/icons/apple icon.png');
const googleIcon = require('@/assets/icons/google icon.png');
const emailIcon = require('@/assets/icons/email.png');
const appLogo = require('@/assets/images/passage-brand-assets/icon.png');

type Provider = 'apple' | 'email' | 'google' | 'guest' | null;

export default function SaveYourSpaceScreen() {
  const router = useRouter();
  const { startTrack } = useLocalSearchParams<{ startTrack?: string }>();
  const wantsTrack = startTrack === '1';
  const { playSoundscape } = usePlayerActions();
  const [loading, setLoading] = useState<Provider>(null);
  const [authReady, setAuthReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reuses the cached pick from the recommendations screen (same query key,
  // still within its staleTime) rather than re-fetching it here.
  const recommendationsQuery = useQuery({
    queryKey: getOnboardingRecommendationsQueryKey(),
    queryFn: () => getOnboardingRecommendations(4),
    staleTime: 5 * 60 * 1000,
    enabled: wantsTrack,
  });
  const best = recommendationsQuery.data?.best_match ?? null;
  const alternatives = recommendationsQuery.data?.alternatives ?? [];

  useEffect(() => {
    if (!authReady) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [authReady]);

  const enterMainApp = async () => {
    if (wantsTrack && best) {
      await playSoundscape(best, { queue: [best, ...alternatives] });
      resetToMainPlayer(router);
      return;
    }
    resetToMainApp(router);
  };

  const ensureComplete = async () => {
    const [completed, answers] = await Promise.all([
      isGuestOnboardingComplete(),
      getGuestOnboardingAnswers(),
    ]);
    if (!isGuestOnboardingReady(answers)) {
      router.replace('/passage-help');
      return false;
    }
    if (!completed) await markGuestOnboardingComplete();
    return true;
  };

  const finishAuthenticatedFlow = async () => {
    await migrateGuestOnboardingAfterAuth();
    await enterMainApp();
  };

  const handleGoogle = async () => {
    if (loading) return;
    let authenticated = false;
    setErrorMessage('');
    setLoading('google');
    try {
      if (!(await ensureComplete())) return;
      const session = await signInWithGoogle();
      if (!session) {
        setLoading(null);
        return;
      }
      authenticated = true;
      setAuthReady(true);
      await finishAuthenticatedFlow();
    } catch (error) {
      setErrorMessage(
        authenticated
          ? 'You’re signed in, but your preferences could not be saved. Try again.'
          : error instanceof Error
            ? error.message
            : 'Google sign in is unavailable right now.'
      );
      setLoading(null);
    }
  };

  const handleApple = async () => {
    if (loading) return;
    let authenticated = false;
    setErrorMessage('');
    setLoading('apple');
    try {
      if (!(await ensureComplete())) return;
      const session = await signInWithApple();
      if (!session) {
        setLoading(null);
        return;
      }
      authenticated = true;
      setAuthReady(true);
      await finishAuthenticatedFlow();
    } catch (error) {
      setErrorMessage(
        authenticated
          ? 'You’re signed in, but your preferences could not be saved. Try again.'
          : error instanceof Error
            ? error.message
            : 'Apple sign in is unavailable right now.'
      );
      setLoading(null);
    }
  };

  const handleEmail = async () => {
    if (loading) return;
    setErrorMessage('');
    setLoading('email');
    try {
      if (!(await ensureComplete())) return;
      router.push('/create-account?from=onboarding');
    } catch {
      setErrorMessage('We could not save your onboarding progress. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const retryMigration = async () => {
    setErrorMessage('');
    try {
      await finishAuthenticatedFlow();
    } catch {
      setErrorMessage('Your preferences still couldn’t be saved. Check your connection and try again.');
    }
  };

  const continueAsGuest = async () => {
    if (loading) return;
    setErrorMessage('');
    setLoading('guest');
    try {
      if (!(await ensureComplete())) return;
      await enterMainApp();
    } catch {
      setErrorMessage('We could not save your onboarding progress. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <OnboardingScaffold
      contentContainerStyle={styles.content}
      onBack={authReady ? undefined : () => router.back()}>
      <Image source={appLogo} style={styles.appIcon} />
      <Text style={styles.heading}>Save your space</Text>
      <Text style={styles.body}>
        Create an account to keep your preferences with you.
      </Text>

      <View style={styles.buttons}>
        {authReady ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void retryMigration()}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <Text style={styles.retryLabel}>Retry saving preferences</Text>
          </Pressable>
        ) : (
          <>
            <AuthButton
              disabled={Boolean(loading)}
              iconSource={appleIcon}
              iconTintColor={HalcyonColors.textPrimary}
              label="Continue with Apple"
              loading={loading === 'apple'}
              onPress={() => void handleApple()}
            />
            <AuthButton
              disabled={Boolean(loading)}
              iconSource={googleIcon}
              label="Continue with Google"
              loading={loading === 'google'}
              onPress={() => void handleGoogle()}
            />
            <AuthButton
              disabled={Boolean(loading)}
              iconSource={emailIcon}
              iconTintColor={HalcyonColors.textPrimary}
              label="Sign up with email"
              loading={loading === 'email'}
              onPress={() => void handleEmail()}
            />
          </>
        )}
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

      {!authReady ? (
        <Pressable
          accessibilityRole="button"
          disabled={Boolean(loading)}
          hitSlop={10}
          onPress={() => void continueAsGuest()}
          style={({ pressed }) => [
            loading === 'guest' && styles.guestDisabled,
            pressed && !loading && styles.pressed,
          ]}>
          <Text style={styles.guestLink}>
            {loading === 'guest' ? 'Opening Passage…' : 'Continue as guest'}
          </Text>
        </Pressable>
      ) : null}

      <LegalDisclaimer
        linkStyle={styles.legalLink}
        style={styles.legal}
        textStyle={styles.legalText}
      />
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  appIcon: {
    borderRadius: 20,
    height: 72,
    width: 72,
  },
  body: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    maxWidth: 280,
    textAlign: 'center',
  },
  buttons: {
    gap: 10,
    marginTop: 26,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 28,
  },
  error: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    textAlign: 'center',
  },
  guestLink: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 22,
    textDecorationLine: 'underline',
  },
  guestDisabled: { opacity: 0.5 },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 31,
    lineHeight: 36,
    
  },
  legal: { marginTop: 34, maxWidth: 300 },
  legalLink: { color: HalcyonColors.textSecondary, textDecorationLine: 'underline' },
  legalText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
  retryButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 18,
    justifyContent: 'center',
    minHeight: 52,
  },
  retryLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
});
