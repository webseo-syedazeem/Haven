import { Image, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';
import { safeGoBack } from '@/lib/navigation';

const focusImage = require('@/assets/images/focus-mode-realistic-v2.webp');
const calmImage = require('@/assets/images/relax-mode-realistic-v2.webp');
const sleepImage = require('@/assets/images/sleep-mode-realistic-v2.webp');

type GoalCard = {
  id: 'focus' | 'calm' | 'sleep';
  image: any;
  label: string;
};

const PREVIEW_ACCENT_COLOR = '#FFFFFF';

const GOAL_CARDS: readonly GoalCard[] = [
  {
    id: 'focus',
    image: focusImage,
    label: 'Focus deeply',
  },
  {
    id: 'calm',
    image: calmImage,
    label: 'Feel calmer',
  },
  {
    id: 'sleep',
    image: sleepImage,
    label: 'Sleep easier',
  },
] as const;

export default function WhatItDoesScreen() {
  const router = useRouter();
  const handleContinue = () => {
    router.push('/select-focus' as any);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 3 Active */}
      <OnboardingStepHeader
        activeColor={PREVIEW_ACCENT_COLOR}
        currentStep={3}
        onBack={() => safeGoBack(router)}
        showBack
        totalSteps={4}
      />

      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>
            A place for{'\n'}the state you need.
          </Text>
        </View>

        {/* Three decorative preview cards */}
        <View style={styles.cardsRow}>
          {GOAL_CARDS.map((card) => (
            <View key={card.id} style={styles.cardColumn}>
              <View style={[styles.imageCard, styles.imageCardPreview]}>
                <Image
                  resizeMode="cover"
                  source={card.image}
                  style={styles.cardImage}
                />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        {/* Subtitle / Explanatory Text */}
        <View style={styles.copyBlock}>
          <Text style={styles.subtitle}>
            Choose a goal
          </Text>
          <Text style={styles.subtitle}>
            Passage shapes the sound around it.
          </Text>
        </View>
      </View>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <OnboardingPillButton
          arrowAtEnd
          label="CONTINUE"
          onPress={handleContinue}
          variant="white"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cardColumn: {
    alignItems: 'center',
    flex: 1,
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardLabel: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  copyBlock: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  footer: {
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
    width: '100%',
  },
  headerBlock: {
    alignItems: 'center',
    paddingTop: 8,
    width: '100%',
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 40,
    letterSpacing: -0.5,
    lineHeight: 46,
    textAlign: 'center',
  },
  imageCard: {
    borderRadius: 14,
    height: 360,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageCardPreview: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
  subtitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
