import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';
import {
  getOnboardingAnswers,
  saveOnboardingAnswers,
} from '@/lib/onboarding';

const focusImage = require('@/assets/images/focus-mode.webp');
const calmImage = require('@/assets/images/relax-mode.webp');
const sleepImage = require('@/assets/images/sleep-mode.webp');

type GoalCard = {
  description: string;
  id: 'focus' | 'calm' | 'sleep';
  image: any;
  label: string;
};

const GOAL_SELECTION_COLOR = '#FFFFFF';

const GOAL_CARDS: readonly GoalCard[] = [
  {
    description: 'Create the conditions for deeper, calmer, and steadier work.',
    id: 'focus',
    image: focusImage,
    label: 'Focus deeply',
  },
  {
    description: 'Release tension and find calm through natural spaces.',
    id: 'calm',
    image: calmImage,
    label: 'Feel calmer',
  },
  {
    description: 'Create the conditions to wind down and rest more easily.',
    id: 'sleep',
    image: sleepImage,
    label: 'Sleep easier',
  },
] as const;

export default function WhatItDoesScreen() {
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<GoalCard['id'] | null>(null);
  const [hydrating, setHydrating] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const selectedGoalCard = GOAL_CARDS.find((card) => card.id === selectedGoal);

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers()
      .then((answers) => {
        if (!active) return;
        const savedGoal = GOAL_CARDS.find(
          (card) => answers.user_goals === card.label
        );
        setSelectedGoal(savedGoal?.id ?? null);
      })
      .catch(() => {
        if (active) setSaveError('We could not load your saved choice.');
      })
      .finally(() => {
        if (active) setHydrating(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleGoalSelect = (card: GoalCard) => {
    setSaveError('');
    setSelectedGoal(card.id);
  };

  const handleContinue = async () => {
    if (hydrating || saving || !selectedGoalCard) return;

    setSaving(true);
    setSaveError('');
    try {
      await saveOnboardingAnswers({ user_goals: selectedGoalCard.label });
      router.push('/select-focus' as any);
    } catch (err) {
      console.warn('[what-it-does] Failed to save goal:', err);
      setSaveError('We could not save that choice. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 3 Active */}
      <OnboardingStepHeader
        activeColor={GOAL_SELECTION_COLOR}
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
                disabled={hydrating}
                onPress={() => handleGoalSelect(card)}
                style={({ pressed }) => [
                  styles.cardColumn,
                  pressed && styles.cardPressed,
                ]}
              >
                <View
                  style={[
                    styles.imageCard,
                    isSelected
                      ? [
                          styles.imageCardSelected,
                          { borderColor: GOAL_SELECTION_COLOR },
                        ]
                      : styles.imageCardUnselected,
                  ]}
                >
                  <Image
                    resizeMode="cover"
                    source={card.image}
                    style={styles.cardImage}
                  />

                  {isSelected && (
                    <View
                      style={[
                        styles.checkBadge,
                        { backgroundColor: GOAL_SELECTION_COLOR },
                      ]}>
                      <Ionicons color="#0B0B0D" name="checkmark" size={13} />
                    </View>
                  )}
                </View>
                <Text style={styles.cardLabel}>{card.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Subtitle / Explanatory Text */}
        <View style={styles.copyBlock}>
          {selectedGoalCard ? (
            <Text style={styles.subtitle}>{selectedGoalCard.description}</Text>
          ) : (
            <Text style={styles.subtitle}>
            Choose a goal.{'\n'}
            Passage shapes the sound around it.
            </Text>
          )}
        </View>
      </View>

      {/* Footer Continue Button */}
      <View style={styles.footer}>
        {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
        <OnboardingPillButton
          arrowAtEnd
          disabled={hydrating || saving || !selectedGoal}
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
    backgroundColor: GOAL_SELECTION_COLOR,
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
    paddingBottom: 14,
    paddingHorizontal: 24,
    paddingTop: 8,
    width: '100%',
  },
  errorText: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
    textAlign: 'center',
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
  imageCardSelected: {
    borderColor: GOAL_SELECTION_COLOR,
    borderWidth: 2,
  },
  imageCardUnselected: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
});
