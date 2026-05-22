import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

type OnboardingContinueButtonProps = {
  label?: string;
  onPress?: () => void;
};

export function OnboardingContinueButton({ label = 'Continue', onPress }: OnboardingContinueButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.buttonShadow}>
      <LinearGradient
        colors={['#6C9FF3', '#7F86E9', '#B985D8']}
        locations={[0, 0.4962, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.button}>
        <View pointerEvents="none" style={styles.innerShadow}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.innerShadowGradient}
          />
        </View>
        <Text style={styles.buttonText}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonShadow: {
    width: '100%',
    height: 58,
    borderRadius: 29,
    shadowColor: '#7F86E9',
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
    overflow: 'hidden',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowGradient: {
    height: '100%',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
});
