import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { ME_QUERY_KEY } from '@/hooks/useUser';
import type { MeApiResponse } from '@/lib/api/user';
import {
  profileNeedsOnboarding,
  resetToAuthenticatedOnboarding,
} from '@/lib/auth/onboarding-routing';
import { readCachedOnboardingCompleted } from '@/lib/auth/offline-session';
import { restoreSession } from '@/lib/auth/restore-session';
import { hasPlayableDownloads, hydrateLocalDownloads } from '@/lib/local-downloads';
import {
  isGuestOnboardingComplete,
  migrateGuestOnboardingAfterAuth,
  resetGuestOnboardingState,
} from '@/lib/onboarding';
import { queryClient } from '@/lib/query-client';

const welcomeBackground = require('@/assets/images/understand-bg.jpg');

type LaunchState = 'checking' | 'welcome';

export default function FirstPageScreen() {
  const router = useRouter();
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const [launchState, setLaunchState] = useState<LaunchState>('checking');

  useEffect(() => {
    let active = true;

    void (async () => {
      if (reset === '1') {
        await resetGuestOnboardingState();
        if (!active) return;
        setLaunchState('welcome');
        return;
      }

      const [status, guestOnboardingComplete] = await Promise.all([
        restoreSession(),
        isGuestOnboardingComplete(),
      ]);
      if (!active) return;

      if (status === 'signed-out') {
        if (guestOnboardingComplete) {
          router.replace('/(tabs)');
          return;
        }

        setLaunchState('welcome');
        return;
      }

      if (status === 'offline') {
        const cachedOnboardingCompleted = await readCachedOnboardingCompleted();

        if (cachedOnboardingCompleted === true) {
          await hydrateLocalDownloads();
          if (!active) return;

          if (hasPlayableDownloads()) {
            router.replace('/(tabs)/saved?segment=downloads');
            return;
          }
        }
      }

      if (status === 'restored') {
        const me = queryClient.getQueryData<MeApiResponse>(ME_QUERY_KEY);
        if (profileNeedsOnboarding(me)) {
          resetToAuthenticatedOnboarding(router);
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
  }, [router]);

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
        <OnboardingStepHeader currentStep={1} totalSteps={4} />

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
              disabled={isCheckingSession}
              label="Get started"
              onPress={() => router.push('/why-passage' as any)}
            />

            <Pressable
              accessibilityRole="button"
              disabled={isCheckingSession}
              hitSlop={10}
              onPress={() => router.push('/login')}
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
    paddingTop: 28,
    width: '100%',
  },
  bottomBlock: {
    paddingBottom: 24,
    paddingHorizontal: 24,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 44,
    lineHeight: 48,
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
    minHeight: 44,
    marginTop: 12,
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
    fontSize: 15,
    lineHeight: 22,
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
