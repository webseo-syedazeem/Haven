import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { PassageLogo } from '@/components/onboarding/PassageLogo';
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
} from '@/lib/onboarding';
import { queryClient } from '@/lib/query-client';

const welcomeBackground = require('@/assets/images/welcome-bg.png');

type LaunchState = 'checking' | 'welcome';

export default function FirstPageScreen() {
  const router = useRouter();
  const [launchState, setLaunchState] = useState<LaunchState>('checking');

  useEffect(() => {
    let active = true;

    void (async () => {
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
      resizeMode='cover'
      source={welcomeBackground}
      style={styles.welcomeScreen}>
      <StatusBar style='light' />
      <LinearGradient
        colors={[
          'rgba(11,11,13,0.12)',
          'rgba(11,11,13,0.22)',
          'rgba(11,11,13,0.97)',
        ]}
        locations={[0, 0.45, 1]}
        pointerEvents='none'
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'bottom']} style={styles.welcomeSafeArea}>
        <View style={styles.brandBlock}>
       <Text style={styles.logo}>PASSAGE</Text>
          <Text style={styles.proposition}>Soundscapes for Focus, Sleep &amp; Reset</Text>
        </View>

        <View style={styles.actionBlock}>
          <OnboardingContinueButton
            disabled={isCheckingSession}
            label='Get started'
            onPress={() => router.push('/the-promise')}
          />
          <Pressable
            accessibilityRole='button'
            disabled={isCheckingSession}
            hitSlop={10}
            onPress={() => router.push('/login')}
            style={({ pressed }) => [
              styles.loginAction,
              isCheckingSession && styles.disabledAction,
              pressed && !isCheckingSession && styles.linkPressed,
            ]}>
            <Text style={styles.loginLabel}>Log in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

function LaunchLoadingScreen() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 1100,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          duration: 1100,
          toValue: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] });

  return (
    <View style={styles.loadingScreen}>
      <StatusBar style='light' />
      <View style={styles.loadingLine} />
      <Animated.View style={[styles.loadingLogoGlow, { opacity, transform: [{ scale }] }]}>
        <PassageLogo compact showWordmark={false} />
      </Animated.View>
      <Text style={styles.loadingText}>Opening Passage</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  actionBlock: {
    paddingBottom: 18,
    paddingHorizontal: 24,
    width: '100%',
  },
  brandBlock: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  disabledAction: {
    opacity: 0.64,
  },
  linkPressed: {
    opacity: 0.64,
  },
  loadingLine: {
    backgroundColor: HalcyonColors.accent,
    height: 2,
    opacity: 0.9,
    position: 'absolute',
    top: 18,
    width: 28,
  },
  loadingLogoGlow: {
    shadowColor: HalcyonColors.accent,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 22,
  },
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.background,
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 64,
  },
  loadingText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 30,
  },
  loginAction: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: 8,
    paddingHorizontal: 18,
  },
  loginLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  
  },
  logo: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 60,
    lineHeight: 44,
     marginTop: 80,
  },
  proposition: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 17,
    textAlign: 'center',
  },
  welcomeBackgroundImage: { opacity: 0.96 },
  welcomeSafeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  welcomeScreen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
});
