import { StyleSheet, View } from 'react-native';

import { OnboardingBrandHeader } from '@/components/onboarding/OnboardingBrandHeader';

type OnboardingStepHeaderProps = {
  accentColor?: string;
  currentStep: number;
  totalSteps?: number; // default 4
  onBack?: () => void;
  showBack?: boolean;
  activeColor?: string;
};

export const PASSAGE_GOLD = '#EAA850';
export const PASSAGE_SLEEP = '#9FAEFD';

export function OnboardingStepHeader({
  accentColor,
  currentStep,
  totalSteps = 4,
  onBack,
  showBack = false,
  activeColor,
}: OnboardingStepHeaderProps) {
  const resolvedActiveColor = accentColor ?? activeColor ?? PASSAGE_GOLD;

  return (
    <View style={styles.container}>
      <OnboardingBrandHeader onBack={onBack} showBack={showBack} />

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
                  ? [
                      styles.activeSegment,
                      {
                        backgroundColor: resolvedActiveColor,
                        shadowColor: resolvedActiveColor,
                      },
                    ]
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
  container: {
    paddingBottom: 12,
    width: '100%',
  },
  inactiveSegment: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 10,
  },
  segment: {
    borderRadius: 2,
    flex: 1,
    height: 2.5,
  },
});
