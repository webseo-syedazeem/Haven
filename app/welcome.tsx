import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/AuthButton';
import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
import { setGuestModeActive } from '@/lib/auth/session-state';
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

  // Once signed in, back must not return to the sign-in options.
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
      router.replace('/why-passage');
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
      // Gates /api/me, /api/favourites, /api/home/continue-listening and
      // /api/play-history until a real sign in clears it (see
      // lib/auth/session-state.ts) — there is no bearer token to send yet.
      await setGuestModeActive(true);
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
      // Pinned to the very bottom, above the safe-area inset the scaffold applies.
      footer={<AuthLegalFooter />}
      // No back arrow: someone who picks sign up and then wants to sign in uses
      // the Sign in link below instead of retracing their steps.
      >
      <Text style={styles.heading}>Save your space</Text>
      <Text style={styles.body}>
        Create an account to keep your preferences with you.
      </Text>

      <View style={styles.buttons}>
        {authReady ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => void retryMigration()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
              <Text style={styles.retryLabel}>Retry saving preferences</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => void enterMainApp()}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
              <Text style={styles.continueLabel}>Continue to Home</Text>
            </Pressable>
          </>
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
          hitSlop={8}
          onPress={() => router.push('/login')}
          style={styles.signInButton}>
          <Text style={styles.signInPrompt}>
            Already have an account? <Text style={styles.signInLink}>Sign in</Text>
          </Text>
        </Pressable>
      ) : null}

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

    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.72)',
    marginTop: 10,
    maxWidth: 300,
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
  continueButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
  },
  continueLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
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
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  guestDisabled: { opacity: 0.5 },
  heading: {
    ...Typography.screenHeading,
    textAlign: 'center',
  },
  pressed: { opacity: 0.72 },
  signInButton: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 4,
  },
  signInLink: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansSemiBold,
    fontWeight: '600',
  },
  signInPrompt: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
  },
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
    fontSize: 16,
    fontWeight: '600',
  },
});
