import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HalcyonColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const appIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');

type OnboardingStepHeaderProps = {
  currentStep: number; // 1 to 4
  totalSteps?: number; // default 4
  onBack?: () => void;
  showBack?: boolean;
};

export const PASSAGE_GOLD = '#EAA850';

export function OnboardingStepHeader({
  currentStep,
  totalSteps = 4,
  onBack,
  showBack = false,
}: OnboardingStepHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brandGroup}>
          {showBack && onBack ? (
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Ionicons color="#FFFFFF" name="chevron-back" size={20} />
            </Pressable>
          ) : null}
          <Image resizeMode="contain" source={appIcon} style={styles.iconMark} />
          <Text style={styles.brandTitle}>Passage</Text>
        </View>
      </View>

      {/* 4-Segment Progress Bar */}
      <View style={styles.progressRow}>
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;

          return (
            <View
              key={`step-${stepNumber}`}
              style={[
                styles.segment,
                isActive ? styles.activeSegment : styles.inactiveSegment,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeSegment: {
    backgroundColor: PASSAGE_GOLD,
    shadowColor: PASSAGE_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    padding: 2,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  brandGroup: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginLeft: 8,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    width: '100%',
  },
  iconMark: {
    borderRadius: 5,
    height: 24,
    width: 24,
  },
  inactiveSegment: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
    width: '100%',
  },
  segment: {
    borderRadius: 2,
    flex: 1,
    height: 2.5,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
