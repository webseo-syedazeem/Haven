import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OnboardingPillButton } from '@/components/onboarding/OnboardingPillButton';
import { OnboardingStepHeader, PASSAGE_GOLD } from '@/components/onboarding/OnboardingStepHeader';
import { AppFonts } from '@/constants/theme';
import { saveOnboardingAnswers } from '@/lib/onboarding';

const focusImage = require('@/assets/images/preview-library-dusk.jpg');
const stressImage = require('@/assets/images/preview-zen-garden.jpg');
const sleepImage = require('@/assets/images/preview-night-train.jpg');

type FocusOption = {
  id: 'focus' | 'stress' | 'sleep';
  mode: 'focus' | 'relax' | 'sleep';
  image: any;
  label: string;
  description: string;
  buttonLabel: string;
};

const OPTIONS: readonly FocusOption[] = [
  {
    id: 'focus',
    mode: 'focus',
    image: focusImage,
    label: 'Focus',
    description: 'Create the conditions for deeper, steadier work.',
    buttonLabel: 'CONTINUE WITH FOCUS',
  },
  {
    id: 'stress',
    mode: 'relax',
    image: stressImage,
    label: 'Stress',
    description: 'Release tension and find calm through natural spaces.',
    buttonLabel: 'CONTINUE WITH STRESS',
  },
  {
    id: 'sleep',
    mode: 'sleep',
    image: sleepImage,
    label: 'Sleep',
    description: 'Drift off gently with layered ambient soundscapes.',
    buttonLabel: 'CONTINUE WITH SLEEP',
  },
] as const;

export default function SelectFocusScreen() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<'focus' | 'stress' | 'sleep'>('focus');
  const [saving, setSaving] = useState(false);

  const selectedOption = OPTIONS.find((item) => item.id === selectedId) ?? OPTIONS[0];

  const handleContinue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await saveOnboardingAnswers({ startingMode: selectedOption.mode });
      router.push('/backed-by-science');
    } catch (error) {
      console.warn('[select-focus] error saving starting mode:', error);
      router.push('/backed-by-science');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Header with Step 4 Active */}
      <OnboardingStepHeader
        currentStep={4}
        onBack={() => router.back()}
        showBack
        totalSteps={4}
      />

      <View style={styles.content}>
        {/* Heading */}
        <View style={styles.headerBlock}>
          <Text style={styles.heading}>
            What would you{'\n'}like help with?
          </Text>
        </View>

        {/* 3 Selectable Vertical Cards */}
        <View style={styles.cardsRow}>
          {OPTIONS.map((option) => {
            const isSelected = option.id === selectedId;

            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelectedId(option.id)}
                style={styles.cardColumn}
              >
                <View
                  style={[
                    styles.imageCard,
                    isSelected ? styles.imageCardSelected : styles.imageCardUnselected,
                  ]}
                >
                  <Image
                    resizeMode="cover"
                    source={option.image}
                    style={styles.cardImage}
                  />

                  {/* Selected checkmark badge in top-right */}
                  {isSelected ? (
                    <View style={styles.checkBadge}>
                      <Ionicons color="#0B0B0D" name="checkmark" size={14} />
                    </View>
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.cardLabel,
                    isSelected && styles.cardLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Dynamic Descriptive Text */}
        <View style={styles.copyBlock}>
          <Text style={styles.descriptionText}>
            {selectedOption.description}
          </Text>
        </View>
      </View>

      {/* Dynamic Gold Action Button */}
      <View style={styles.footer}>
        <OnboardingPillButton
          disabled={saving}
          label={selectedOption.buttonLabel}
          onPress={handleContinue}
          variant="gold"
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
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansMedium,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: '#FFFFFF',
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
    paddingHorizontal: 12,
  },
  descriptionText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
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
    height: 230,
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
    opacity: 0.82,
  },
  safeArea: {
    backgroundColor: '#0B0B0D',
    flex: 1,
  },
});
