import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';

const focusImage = require('@/assets/images/preview-library-dusk.jpg');
const calmImage = require('@/assets/images/preview-zen-garden.jpg');
const sleepImage = require('@/assets/images/preview-night-train.jpg');

const GOAL_CARDS = [
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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 3 Active */}
      <OnboardingStepHeader
        currentStep={3}
        onBack={() => router.back()}
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

        {/* 3 Vertical Cards Side-by-Side */}
        <View style={styles.cardsRow}>
          {GOAL_CARDS.map((card) => (
            <View key={card.id} style={styles.cardColumn}>
              <View style={styles.imageCard}>
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
            Choose a goal.{'\n'}
            Passage shapes the sound around it.
          </Text>
        </View>
      </View>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        <OnboardingPillButton
          label="CONTINUE"
          onPress={() => router.push('/select-focus' as any)}
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
    fontSize: 13,
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
    paddingBottom: 24,
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
    fontSize: 38,
    letterSpacing: -0.5,
    lineHeight: 44,
    textAlign: 'center',
  },
  imageCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    height: 230,
    overflow: 'hidden',
    width: '100%',
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
  },
});
