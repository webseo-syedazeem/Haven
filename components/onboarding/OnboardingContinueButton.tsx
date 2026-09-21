import { Ionicons } from '@expo/vector-icons';
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
  /** Pill shape, uppercase label and a trailing arrow — off by default so existing screens are unaffected. */
  showArrow?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'amber';
};

export function OnboardingContinueButton({
  disabled = false,
  label = 'Continue',
  loading = false,
  onPress,
  showArrow = false,
  style,
  variant = 'primary',
}: OnboardingContinueButtonProps) {
  const unavailable = disabled || loading;
  const isAmber = variant === 'amber' || showArrow;
  const labelColor =
    variant === 'secondary'
      ? HalcyonColors.textPrimary
      : isAmber
        ? '#0B0B0D'
        : HalcyonColors.background;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        showArrow && styles.pill,
        variant === 'secondary' && styles.secondary,
        isAmber && styles.amber,
        unavailable && styles.disabled,
        pressed && !unavailable && (isAmber ? styles.amberPressed : styles.pressed),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? HalcyonColors.background : HalcyonColors.accent}
          size="small"
        />
      ) : (
        <View style={styles.labelRow}>
          <Text
            style={[
              styles.label,
              variant === 'secondary' && styles.secondaryLabel,
              showArrow && styles.labelUppercase,
            ]}>
            {label}
          </Text>
          {showArrow ? (
            <Ionicons color={labelColor} name="arrow-forward" size={16} style={styles.arrow} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  arrow: {
    marginLeft: 8,
  },
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
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  labelUppercase: {
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pill: {
    borderRadius: HalcyonRadius.pill,
    minHeight: 56,
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
  amber: {
    backgroundColor: '#F4B34C',
  },
  amberPressed: {
    backgroundColor: '#DF9E37',
    transform: [{ scale: 0.995 }],
  },
  secondaryLabel: {
    color: HalcyonColors.textPrimary,
  },
});
