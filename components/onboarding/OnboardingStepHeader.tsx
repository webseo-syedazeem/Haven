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
  activeColor?: string;
};

export const PASSAGE_GOLD = '#EAA850';
export const PASSAGE_SLEEP = '#9FAEFD';

export function OnboardingStepHeader({
  currentStep,
  totalSteps = 4,
  onBack,
  showBack = false,
  activeColor = PASSAGE_GOLD,
}: OnboardingStepHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {/* Absolute centered Brand - locked to horizontal center */}
        <View pointerEvents="none" style={styles.brandCenterAbsolute}>
          <Image resizeMode="contain" source={appIcon} style={styles.iconMark} />
          <Text style={styles.brandTitle}>Passage</Text>
        </View>

        <View style={styles.sideSlot}>
          {showBack && onBack ? (
            <Pressable
              accessibilityLabel="Go back"
              hitSlop={12}
              onPress={onBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Ionicons color="#FFFFFF" name="chevron-back" size={22} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sideSlot} />
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
                isActive
                  ? [styles.activeSegment, { backgroundColor: activeColor, shadowColor: activeColor }]
                  : styles.inactiveSegment,
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
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  brandCenterAbsolute: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 0,
  },
  sideSlot: {
    alignItems: 'flex-start',
    height: 40,
    justifyContent: 'center',
    width: 40,
    zIndex: 1,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: 9,
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    width: '100%',
  },
  iconMark: {
    height: 22,
    resizeMode: 'contain',
    width: 38,
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
    height: 40,
    justifyContent: 'space-between',
    position: 'relative',
    width: '100%',
  },
});
