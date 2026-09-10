import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const BUTTON_GRAIN = [
  { left: '7%', opacity: 0.16, top: '24%' },
  { left: '14%', opacity: 0.1, top: '70%' },
  { left: '22%', opacity: 0.13, top: '42%' },
  { left: '31%', opacity: 0.08, top: '18%' },
  { left: '39%', opacity: 0.12, top: '76%' },
  { left: '48%', opacity: 0.09, top: '34%' },
  { left: '57%', opacity: 0.15, top: '62%' },
  { left: '66%', opacity: 0.1, top: '22%' },
  { left: '74%', opacity: 0.13, top: '48%' },
  { left: '83%', opacity: 0.08, top: '74%' },
  { left: '91%', opacity: 0.12, top: '30%' },
] as const;

type OnboardingContinueButtonProps = {
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary';
};

export function OnboardingContinueButton({
  disabled = false,
  label = 'Continue',
  loading = false,
  onPress,
  style,
  variant = 'primary',
}: OnboardingContinueButtonProps) {
  const unavailable = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondary,
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? HalcyonColors.background : HalcyonColors.accent}
          size="small"
        />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.secondaryLabel]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.card,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 20,
    width: '100%',
  },
  disabled: {
    opacity: 0.42,
  },
  label: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  pressed: {
    backgroundColor: HalcyonColors.accentPressed,
    transform: [{ scale: 0.995 }],
  },
  secondary: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderWidth: 1,
  },
  secondaryLabel: {
    color: HalcyonColors.textPrimary,
  },
});
