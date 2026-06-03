import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';

import { AppFonts } from '@/constants/theme';

type ButtonVariant = 'default' | 'dayFeel';

type OnboardingContinueButtonProps = {
  label?: string;
  onPress?: () => void;
  textStyle?: StyleProp<TextStyle>;
  variant?: ButtonVariant;
};

const gradientConfig = {
  default: {
    colors: ['#6C9FF3', '#7F86E9', '#B985D8'] as const,
    locations: [0, 0.4962, 1] as const,
  },
  dayFeel: {
    colors: ['#6339FB', '#3770FC', '#6AAFE9'] as const,
    locations: [0.0247, 0.5499, 1] as const,
  },
};

export function OnboardingContinueButton({
  label = 'Continue',
  onPress,
  textStyle,
  variant = 'default',
}: OnboardingContinueButtonProps) {
  const gradient = gradientConfig[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        styles.buttonShadow,
        variant === 'dayFeel' && styles.dayFeelButtonShadow,
      ]}>
      <LinearGradient
        colors={gradient.colors}
        locations={gradient.locations}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.button}>
        {variant === 'dayFeel' ? (
          <>
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255, 255, 255, 0.58)', 'rgba(255, 255, 255, 0.16)', 'rgba(255, 255, 255, 0)']}
              locations={[0, 0.5, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.dayFeelGloss}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['rgba(255, 255, 255, 0.32)', 'rgba(255, 255, 255, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dayFeelReflection}
            />
          </>
        ) : (
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255, 255, 255, 0.46)', 'rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0)']}
            locations={[0, 0.48, 1]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.defaultGloss}
          />
        )}
        <View pointerEvents="none" style={styles.innerShadow}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.innerShadowGradient}
          />
        </View>
        <Text style={[styles.buttonText, textStyle]}>{label}</Text>
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
  dayFeelButtonShadow: {
    shadowColor: '#6339FB',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 10,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    overflow: 'hidden',
  },
  dayFeelGloss: {
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
    height: '58%',
    left: 0,
    opacity: 0.78,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  dayFeelReflection: {
    height: '100%',
    left: 0,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    width: '46%',
  },
  defaultGloss: {
    borderTopLeftRadius: 29,
    borderTopRightRadius: 29,
    height: '54%',
    left: 0,
    opacity: 0.62,
    position: 'absolute',
    right: 0,
    top: 0,
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
