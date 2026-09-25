import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader, PASSAGE_GOLD, PASSAGE_SLEEP } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';
import { getOnboardingAnswers, saveOnboardingAnswers } from '@/lib/onboarding';

const focusImage = require('@/assets/images/preview-library-dusk.webp');
const calmImage = require('@/assets/images/preview-zen-garden.webp');
const sleepImage = require('@/assets/images/preview-night-train.webp');

type GoalCard = {
  id: 'focus' | 'calm' | 'sleep';
  mode: 'focus' | 'relax' | 'sleep';
  image: any;
  label: string;
};

const GOAL_CARDS: readonly GoalCard[] = [
  {
    id: 'focus',
    mode: 'focus',
    image: focusImage,
    label: 'Focus deeply',
  },
  {
    id: 'calm',
    mode: 'relax',
    image: calmImage,
    label: 'Feel calmer',
  },
  {
    id: 'sleep',
    mode: 'sleep',
    image: sleepImage,
    label: 'Sleep easier',
  },
] as const;

export default function WhatItDoesScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<'focus' | 'calm' | 'sleep'>('focus');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers().then((answers) => {
      if (!active) return;
      if (answers.startingMode === 'relax') {
        setSelectedGoal('calm');
      } else if (answers.startingMode === 'sleep') {
        setSelectedGoal('sleep');
      } else if (answers.startingMode === 'focus') {
        setSelectedGoal('focus');
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    const card = GOAL_CARDS.find((c) => c.id === selectedGoal);
    if (card) {
      try {
        await saveOnboardingAnswers({ startingMode: card.mode });
      } catch (err) {
        console.warn('[what-it-does] Failed to save starting mode:', err);
      }
    }
    setSaving(false);
    router.push('/select-focus' as any);
  };

  const isSleep = selectedGoal === 'sleep';
  const themeColor = isSleep ? PASSAGE_SLEEP : PASSAGE_GOLD;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 3 Active */}
      <OnboardingStepHeader
        activeColor={themeColor}
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

        {/* 3 Selectable Vertical Cards */}
        <View style={styles.cardsRow}>
          {GOAL_CARDS.map((card) => {
            const isSelected = card.id === selectedGoal;

            return (
              <Pressable
                key={card.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedGoal(card.id)}
                style={({ pressed }) => [
                  styles.cardColumn,
                  pressed && styles.cardPressed,
                ]}
              >
                <View
                  style={[
                    styles.imageCard,
                    isSelected
                      ? [styles.imageCardSelected, { borderColor: themeColor }]
                      : styles.imageCardUnselected,
                  ]}
                >
                  <Image
                    resizeMode="cover"
                    source={card.image}
                    style={styles.cardImage}
                  />

                  {isSelected && (
                    <View style={[styles.checkBadge, { backgroundColor: themeColor }]}>
                      <Ionicons color="#0B0B0D" name="checkmark" size={13} />
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.cardLabel,
                    isSelected && styles.cardLabelSelected,
                  ]}
                >
                  {card.label}
                </Text>
              </Pressable>
            );
          })}
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
          disabled={saving}
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
    color: 'rgba(255, 255, 255, 0.65)',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardPressed: {
    opacity: 0.88,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    width: '100%',
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: PASSAGE_GOLD,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 20,
    zIndex: 2,
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
    height: 360,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  imageCardSelected: {
    borderColor: PASSAGE_GOLD,
    borderWidth: 2,
  },
  imageCardUnselected: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    opacity: 0.72,
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

