import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { type Href, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { PassageColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSinglePress } from '@/hooks/useSinglePress';
import { ME_QUERY_KEY } from '@/hooks/useUser';
import type { MeApiResponse } from '@/lib/api/user';
import { profileNeedsOnboarding, resetToAuthenticatedOnboarding } from '@/lib/auth/onboarding-routing';
import { restoreSession } from '@/lib/auth/restore-session';
import { hasSeenIntro, setIntroSeen } from '@/lib/auth/intro-flag';
import {
  getOnboardingAnswers,
  getOnboardingResumeRoute,
  hasOnboardingProgress,
} from '@/lib/onboarding';
import { recoverAbandonedOnboardingReplay } from '@/lib/onboarding-replay';
import { queryClient } from '@/lib/query-client';

const welcomeBackground = require('@/assets/images/first-onboarding-cedar-trail-v2.webp');

export default function FirstPageScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const handleLoginPress = useSinglePress(() => {
    void setIntroSeen();
    router.push('/login?from=intro');
  });
  const handleGetStartedPress = useSinglePress(() => {
    void getOnboardingAnswers()
      .then((answers) => router.push(getOnboardingResumeRoute(answers) as Href))
      .catch(() => router.push('/why-passage'));
  });

  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp();
      return true;
    });
    return () => subscription.remove();
  }, []));

  useEffect(() => {
    let active = true;
    void (async () => {
      await recoverAbandonedOnboardingReplay();
      const status = await restoreSession();
      if (!active) return;

      if (status === 'signed-out') {
        try {
          const answers = await getOnboardingAnswers();
          if (hasOnboardingProgress(answers)) {
            router.replace(getOnboardingResumeRoute(answers) as Href);
            return;
          }
        } catch (error) {
          console.warn('[onboarding] could not restore local progress', error);
        }

        if (await hasSeenIntro()) {
          router.replace('/login?launch=1');
          return;
        }
        setChecking(false);
        return;
      }

      const me = queryClient.getQueryData<MeApiResponse>(ME_QUERY_KEY);
      if (profileNeedsOnboarding(me)) {
        await resetToAuthenticatedOnboarding(router);
        return;
      }
      router.replace('/(tabs)');
    })();
    return () => { active = false; };
  }, [router]);

  if (checking) {
    return <View style={styles.loading}><StatusBar style="light" /><ActivityIndicator color={PassageColors.accent} size="large" /></View>;
  }

  return (
    <ImageBackground imageStyle={styles.backgroundImage} resizeMode="cover" source={welcomeBackground} style={styles.screen}>
      <StatusBar style="light" />
      <LinearGradient colors={['rgba(11,11,13,0.3)', 'rgba(11,11,13,0.1)', 'rgba(11,11,13,0.5)', 'rgba(11,11,13,0.95)']} locations={[0, 0.25, 0.65, 1]} pointerEvents="none" style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <OnboardingStepHeader activeColor="#FFFFFF" currentStep={1} totalSteps={4} />
        <View style={styles.bottomBlock}>
          <Text style={styles.heading}>Go somewhere.{'\n'}Without going{'\n'}anywhere.</Text>
          <Text style={styles.subtitle}>Immersive soundscapes{'\n'}for focus, calm and sleep.</Text>
          <View style={styles.actions}>
            <OnboardingPillButton arrowAtEnd label="Get started" onPress={handleGetStartedPress} />
            <Pressable accessibilityRole="button" hitSlop={10} onPress={handleLoginPress} style={({ pressed }) => [styles.loginAction, pressed && styles.pressed]}>
              <Text style={styles.loginLabel}>I already have an account</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  actions: { paddingTop: 34, width: '100%' },
  backgroundImage: { opacity: 1 },
  bottomBlock: { paddingBottom: 14, paddingHorizontal: 24, width: '100%' },
  heading: { color: '#FFFFFF', fontFamily: AppFonts.displayRegular, fontSize: 46, lineHeight: 52, letterSpacing: -0.5 },
  loading: { alignItems: 'center', backgroundColor: PassageColors.background, flex: 1, justifyContent: 'center' },
  loginAction: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', marginTop: 8, minHeight: 32, paddingHorizontal: 18 },
  loginLabel: { color: '#FFFFFF', fontFamily: AppFonts.sansRegular, fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' },
  pressed: { opacity: 0.64 },
  safeArea: { flex: 1, justifyContent: 'space-between' },
  screen: { backgroundColor: '#0B0B0D', flex: 1 },
  subtitle: { color: 'rgba(255, 255, 255, 0.8)', fontFamily: AppFonts.sansRegular, fontSize: 16, lineHeight: 24, marginTop: 14 },
});
