import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSinglePress } from '@/hooks/useSinglePress';

type OnboardingContinueButtonProps = {
  accentColor?: string;
  accentPressedColor?: string;
  disabled?: boolean;
  label?: string;
  loading?: boolean;
  onPress?: () => void;
  /** Pill shape, uppercase label and a trailing arrow — off by default so existing screens are unaffected. */
  showArrow?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'amber' | 'lavender';
};

export function OnboardingContinueButton({
  accentColor,
  accentPressedColor,
  disabled = false,
  label = 'Continue',
  loading = false,
  onPress,
  showArrow = false,
  style,
  variant = 'primary',
}: OnboardingContinueButtonProps) {
  const unavailable = disabled || loading;
  const handlePress = useSinglePress(onPress);
  const isLavender = variant === 'lavender';
  const isAmber = variant === 'amber';
  const usesCustomAccent = Boolean(accentColor);
  const labelColor =
    variant === 'secondary'
      ? PassageColors.textPrimary
      : isAmber || isLavender
        ? '#0B0B0D'
        : PassageColors.background;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        showArrow && styles.pill,
        variant === 'secondary' && styles.secondary,
        isAmber && styles.amber,
        isLavender && styles.lavender,
        usesCustomAccent ? { backgroundColor: accentColor } : null,
        unavailable && styles.disabled,
        pressed &&
          !unavailable &&
          (usesCustomAccent
            ? [
                styles.pressedScale,
                { backgroundColor: accentPressedColor ?? accentColor },
              ]
            : isLavender
              ? styles.lavenderPressed
              : isAmber
                ? styles.amberPressed
                : styles.pressed),
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={labelColor} size="small" />
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
            <Ionicons color={labelColor} name="arrow-forward" size={20} style={styles.arrow} />
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
    backgroundColor: PassageColors.accent,
    borderRadius: PassageRadius.card,
    justifyContent: 'center',
    minHeight: 60,
    paddingHorizontal: 20,
    width: '100%',
  },
  disabled: {
    opacity: 0.42,
  },
  label: {
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
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
    borderRadius: PassageRadius.pill,
    minHeight: 60,
  },
  pressed: {
    backgroundColor: PassageColors.accentPressed,
    transform: [{ scale: 0.995 }],
  },
  pressedScale: {
    transform: [{ scale: 0.995 }],
  },
  secondary: {
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderWidth: 1,
  },
  amber: {
    backgroundColor: '#F4B34C',
  },
  amberPressed: {
    backgroundColor: '#DF9E37',
    transform: [{ scale: 0.995 }],
  },
  lavender: {
    backgroundColor: '#9FAEFD',
  },
  lavenderPressed: {
    backgroundColor: '#8B9DFC',
    transform: [{ scale: 0.995 }],
  },
  secondaryLabel: {
    color: PassageColors.textPrimary,
  },
});
