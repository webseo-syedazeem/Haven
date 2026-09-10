import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { PassageLogo } from '@/components/onboarding/PassageLogo';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingRecommendations,
  getOnboardingRecommendationsQueryKey,
} from '@/lib/onboarding';

const MINIMUM_BUILD_TIME_MS = 1800;
const MAXIMUM_RECOMMENDATION_WAIT_MS = 5000;

export default function BuildingProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
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

  useEffect(() => {
    let active = true;
    const delay = new Promise<void>((resolve) => setTimeout(resolve, MINIMUM_BUILD_TIME_MS));
    const prefetch = queryClient
      .fetchQuery({
        queryKey: getOnboardingRecommendationsQueryKey(),
        queryFn: () => getOnboardingRecommendations(4),
        staleTime: 0,
      })
      .catch(() => null);
    const maximumWait = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), MAXIMUM_RECOMMENDATION_WAIT_MS);
    });

    void Promise.all([delay, Promise.race([prefetch, maximumWait])]).then(() => {
      if (active) router.replace('/onboarding/recommendations' as Href);
    });

    return () => {
      active = false;
    };
  }, [queryClient, router]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.04] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] });

  return (
    <OnboardingScaffold contentContainerStyle={styles.content} scroll={false}>
      <View style={styles.line} />
      <Animated.View style={[styles.logoGlow, { opacity, transform: [{ scale }] }]}>
        <PassageLogo compact showWordmark={false} />
      </Animated.View>
      <Text style={styles.heading}>Building your personal sound profile</Text>
      <Text style={styles.body}>This takes a few seconds.</Text>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  body: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 64,
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 29,
    lineHeight: 34,
    marginTop: 32,
    maxWidth: 300,
    textAlign: 'center',
  },
  line: {
    backgroundColor: HalcyonColors.accent,
    height: 2,
    opacity: 0.9,
    position: 'absolute',
    top: 18,
    width: 28,
  },
  logoGlow: {
    shadowColor: HalcyonColors.accent,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.48,
    shadowRadius: 22,
  },
});
