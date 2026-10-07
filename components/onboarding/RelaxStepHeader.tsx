import { StyleSheet, View } from 'react-native';

import { OnboardingBrandHeader } from '@/components/onboarding/OnboardingBrandHeader';

type RelaxStepHeaderProps = {
  /** Retained for compatibility; the client design does not show step progress. */
  currentStep?: number;
  onBack?: () => void;
};

export function RelaxStepHeader({ onBack }: RelaxStepHeaderProps) {
  return (
    <View style={styles.header}>
      <OnboardingBrandHeader onBack={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 6,
    width: '100%',
  },
});
