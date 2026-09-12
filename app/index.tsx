import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
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
  return (
    <View style={styles.loadingScreen}>
      <StatusBar style='light' />
      <ActivityIndicator color={HalcyonColors.accent} size='large' />
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
