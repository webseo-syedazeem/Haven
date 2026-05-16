import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

import { wellnessColors, wellnessTypography } from '@/constants/wellness-theme';

type OnboardingContinueButtonProps = {
  onPress?: () => void;
};

export function OnboardingContinueButton({ onPress }: OnboardingContinueButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue"
      onPress={onPress}
      style={styles.buttonShadow}>
      <LinearGradient
        colors={[wellnessColors.button.left, wellnessColors.button.center, wellnessColors.button.right]}
        locations={[0, 0.485, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    shadowColor: wellnessColors.button.left,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 7,
    marginBottom: 18,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
  },
  buttonText: {
    ...wellnessTypography.button,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
