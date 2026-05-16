import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { AppColors, AppRadius, AppShadow, AppSpacing, AppTypography } from '@/constants/design';

type PrimaryButtonProps = PressableProps & {
  label: string;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, style, ...props }: PrimaryButtonProps) {
  return (
    <Pressable
      android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, style]}
      {...props}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: AppColors.button,
    borderRadius: 32,
    paddingVertical: AppSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...AppShadow,
  },
  buttonPressed: {
    opacity: 0.94,
  },
  label: {
    color: AppColors.textPrimary,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
