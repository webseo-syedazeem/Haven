import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/AuthButton';
import { AuthLegalFooter } from '@/components/auth/AuthLegalFooter';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { HalcyonColors, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { signInWithApple } from '@/lib/apple-auth';
import { isGuestModeActive, setGuestModeActive } from '@/lib/auth/session-state';
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
import { routeAfterSignIn } from '@/lib/auth/onboarding-routing';
import { resetToMainApp, resetToMainPlayer } from '@/lib/navigation';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

const appleIcon = require('@/assets/icons/apple icon.png');
const googleIcon = require('@/assets/icons/google icon.png');
const emailIcon = require('@/assets/icons/email.png');

type Provider = 'apple' | 'email' | 'google' | 'guest' | null;

export default function SaveYourSpaceScreen() {
  const router = useRouter();
  const { startTrack } = useLocalSearchParams<{ startTrack?: string }>();

  // If the user pressed back from onboarding (guest mode was set but onboarding
  // is not complete), clear guest mode so the app does not skip onboarding on
  // the next launch.
  useFocusEffect(
    useCallback(() => {
      void (async () => {
        if (isGuestModeActive() && !(await isGuestOnboardingComplete())) {
          await setGuestModeActive(false);
        }
      })();
    }, [])
  );
  const wantsTrack = startTrack === '1';
  const { playSoundscape } = usePlayerActions();
  const [loading, setLoading] = useState<Provider>(null);
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

  const enterMainApp = async () => {
    if (wantsTrack && best) {
      await playSoundscape(best, { queue: [best, ...alternatives] });
      resetToMainPlayer(router);
      return;
    }
    resetToMainApp(router);
  };

  /**
   * A choice made here comes first when onboarding has not been done: the person
   * signs in (or continues as guest) and is then taken through onboarding, whose
   * last button goes straight to Home instead of asking them to choose again.
   */
  const isOnboardingDone = async () => {
    const [completed, answers] = await Promise.all([
      isGuestOnboardingComplete(),
      getGuestOnboardingAnswers(),
    ]);
    if (!isGuestOnboardingReady(answers)) return false;
    if (!completed) await markGuestOnboardingComplete();
    return true;
  };

  const finishAuthenticatedFlow = async (onboardingDone = true) => {
    if (!onboardingDone) {
      // Sends a new account to the onboarding it has not finished.
      await routeAfterSignIn(router);
      return;
    }
    // Saving the onboarding answers must not hold a signed-in person on this
    // screen: a failed import stays pending and is retried on the next launch.
    await migrateGuestOnboardingAfterAuth().catch((error) => {
      console.warn('[onboarding] import remains pending after sign in', error);
    });
    await enterMainApp();
  };

  const handleGoogle = async () => {
    if (loading) return;
    let authenticated = false;
    setErrorMessage('');
    setLoading('google');
    try {
      const onboardingDone = await isOnboardingDone();
      const session = await signInWithGoogle();
      if (!session) {
        setLoading(null);
        return;
      }
      authenticated = true;
      await finishAuthenticatedFlow(onboardingDone);
    } catch (error) {
      if (authenticated) {
        console.warn('[auth] finishing sign in failed; continuing to the app', error);
        resetToMainApp(router);
        return;
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'Google sign in is unavailable right now.'
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
      const onboardingDone = await isOnboardingDone();
      const session = await signInWithApple();
      if (!session) {
        setLoading(null);
        return;
      }
      authenticated = true;
      await finishAuthenticatedFlow(onboardingDone);
    } catch (error) {
      if (authenticated) {
        console.warn('[auth] finishing sign in failed; continuing to the app', error);
        resetToMainApp(router);
        return;
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'Apple sign in is unavailable right now.'
      );
      setLoading(null);
    }
  };

  const handleEmail = async () => {
    if (loading) return;
    setErrorMessage('');
    setLoading('email');
    try {
      // Email registration collects the account details first. Once the email
      // is confirmed, /verified routes a new profile into onboarding.
      router.push('/create-account?from=onboarding');
    } finally {
      setLoading(null);
    }
  };

  const continueAsGuest = async () => {
    if (loading) return;
    setErrorMessage('');
    setLoading('guest');
    try {
      if (!(await isOnboardingDone())) {
        // Guest is chosen now; onboarding follows and ends at Home.
        await setGuestModeActive(true);
        router.replace('/why-passage');
        return;
      }
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
      footer={<AuthLegalFooter />}
      onBack={() => router.back()}>
      <Text style={styles.heading}>Save your space</Text>
      <Text style={styles.body}>
        Create an account to keep your preferences with you.
      </Text>

      <View style={styles.buttons}>
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
      </View>

      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

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
});
