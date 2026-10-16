import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSinglePress } from '@/hooks/useSinglePress';
import { ME_QUERY_KEY } from '@/hooks/useUser';
import type { MeApiResponse } from '@/lib/api/user';
import {
  profileNeedsOnboarding,
  resetToAuthenticatedOnboarding,
} from '@/lib/auth/onboarding-routing';
import { restoreSession } from '@/lib/auth/restore-session';
import { hasSeenIntro, setIntroSeen } from '@/lib/auth/intro-flag';
import { isGuestModeActive, setGuestModeActive } from '@/lib/auth/session-state';
import {
  getGuestOnboardingAnswers,
  getOnboardingResumeRoute,
  hasOnboardingProgress,
  isGuestOnboardingComplete,
  migrateGuestOnboardingAfterAuth,
  resetGuestOnboardingState,
} from '@/lib/onboarding';
import { recoverAbandonedOnboardingReplay } from '@/lib/onboarding-replay';
import { queryClient } from '@/lib/query-client';

const welcomeBackground = require('@/assets/images/first-onboarding.webp');

type LaunchState = 'checking' | 'welcome';

export default function FirstPageScreen() {
  const router = useRouter();
  const handleLoginPress = useSinglePress(() => {
    void setIntroSeen();
    router.push('/login?from=intro');
  });
  const handleGetStartedPress = useSinglePress(() => {
    void getGuestOnboardingAnswers()
      .then((answers) => router.push(getOnboardingResumeRoute(answers) as Href))
      .catch(() => router.push('/why-passage'));
  });
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [launchState, setLaunchState] = useState<LaunchState>('checking');

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        BackHandler.exitApp();
        return true;
      });
      return () => subscription.remove();
    }, [])
  );

  useEffect(() => {
    let active = true;

    void (async () => {
      // Undoes any dev "Replay onboarding" run that never reached its final
      // submit (system back out of the first replay screen, or the app was
      // killed mid-replay) before any routing decision below reads local
      // onboarding progress.
      await recoverAbandonedOnboardingReplay();

      if (reset === '1') {
        await resetGuestOnboardingState();
        await setGuestModeActive(false);
        if (!active) return;
        setLaunchState('welcome');
        return;
      }

      const status = await restoreSession();
      if (!active) return;

      if (status === 'signed-out') {
        if (isGuestModeActive()) {
          // Guest completed onboarding → go straight to home.
          if (await isGuestOnboardingComplete()) {
            router.replace('/(tabs)');
            return;
          }
          // Guest chose "Continue as guest" but closed the app before finishing
          // onboarding. Keep guest mode active (so the final screen can skip the
          // account prompt) and resume where they left off.
          try {
            const answers = await getGuestOnboardingAnswers();
            if (!active) return;
            router.replace(getOnboardingResumeRoute(answers) as Href);
          } catch (error) {
            console.warn('[onboarding] could not restore guest progress', error);
            router.replace('/why-passage');
          }
          return;
        }

        try {
          const answers = await getGuestOnboardingAnswers();
          if (!active) return;
          if (hasOnboardingProgress(answers)) {
            router.replace(getOnboardingResumeRoute(answers) as Href);
            return;
          }
        } catch (error) {
          console.warn('[onboarding] could not restore guest progress', error);
        }

        // Neither a session, guest mode, nor onboarding progress, but the
        // intro was already seen: land on Login.
        if (await hasSeenIntro()) {
          if (!active) return;
          router.replace('/login?launch=1');
          return;
        }

        setLaunchState('welcome');
        return;
      }

      if (status === 'offline') {
        const cachedMe = queryClient.getQueryData<MeApiResponse>(ME_QUERY_KEY);
        if (profileNeedsOnboarding(cachedMe)) {
          await resetToAuthenticatedOnboarding(router);
          return;
        }
      }

      if (status === 'restored') {
        const me = queryClient.getQueryData<MeApiResponse>(ME_QUERY_KEY);
        if (profileNeedsOnboarding(me)) {
          await resetToAuthenticatedOnboarding(router);
          return;
        }

        // A completed guest import remains pending after any failed request.
        // Retry it on later authenticated launches without holding the user on
        // the splash screen; successful import invalidates the live queries.
        void migrateGuestOnboardingAfterAuth().catch((error) => {
          console.warn('[onboarding] launch migration remains pending', error);
        });
      }

      router.replace('/(tabs)');
    })();

    return () => {
      active = false;
    };
  }, [reset, router]);

  const isCheckingSession = launchState === 'checking';

  if (isCheckingSession) {
    return <LaunchLoadingScreen />;
  }

  return (
    <ImageBackground
      imageStyle={styles.welcomeBackgroundImage}
      resizeMode="cover"
      source={welcomeBackground}
      style={styles.welcomeScreen}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={[
          'rgba(11,11,13,0.3)',
          'rgba(11,11,13,0.1)',
          'rgba(11,11,13,0.5)',
          'rgba(11,11,13,0.95)',
        ]}
        locations={[0, 0.25, 0.65, 1]}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.welcomeSafeArea}>
        {/* Step 1 Header with Logo & 4-Segment Progress Bar */}
        <OnboardingStepHeader
          activeColor="#FFFFFF"
          currentStep={1}
          totalSteps={4}
        />

        <View style={styles.bottomBlock}>
          <Text style={styles.heading}>
            Go somewhere.{'\n'}
            Without going{'\n'}
            anywhere.
          </Text>

          <Text style={styles.subtitle}>
            Immersive soundscapes{'\n'}for focus, calm and sleep.
          </Text>

          <View style={styles.actionBlock}>
            <OnboardingPillButton
              arrowAtEnd
              disabled={isCheckingSession}
              label="Get started"
              onPress={handleGetStartedPress}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isCheckingSession}
              hitSlop={10}
              onPress={handleLoginPress}
              style={({ pressed }) => [
                styles.loginAction,
                pressed && styles.linkPressed,
              ]}
            >
              <Text style={styles.loginLabel}>I already have an account</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function LaunchLoadingScreen() {
  return (
    <View style={styles.loadingScreen}>
      <StatusBar style="light" />
      <ActivityIndicator color={HalcyonColors.accent} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  actionBlock: {
    paddingTop: 34,
    width: '100%',
  },
  bottomBlock: {
    paddingBottom: 14,
    paddingHorizontal: 24,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 46,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  linkPressed: {
    opacity: 0.64,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.background,
    flex: 1,
    justifyContent: 'center',
  },
  loginAction: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 32,
    paddingHorizontal: 18,
  },
  loginLabel: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  welcomeBackgroundImage: {
    opacity: 1,
  },
  welcomeSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  welcomeScreen: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
});
