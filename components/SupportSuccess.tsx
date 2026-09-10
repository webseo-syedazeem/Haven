import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type SupportSuccessProps = {
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/** The confirmation every support form shows once its request has landed. */
export function SupportSuccess({
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SupportSuccessProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.iconRing}>
        <Ionicons color={HalcyonColors.accent} name="checkmark" size={28} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      <Pressable
        accessibilityLabel={primaryLabel}
        accessibilityRole="button"
        onPress={onPrimary}
        style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
        <Text style={styles.primaryLabel}>{primaryLabel}</Text>
      </Pressable>

      {!!secondaryLabel && !!onSecondary && (
        <Pressable
          accessibilityLabel={secondaryLabel}
          accessibilityRole="button"
          onPress={onSecondary}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Text style={styles.secondaryLabel}>{secondaryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconRing: {
    alignItems: 'center',
    borderColor: HalcyonColors.accent,
    borderRadius: 32,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 29,
    marginTop: 18,
    textAlign: 'center',
  },
  message: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: 300,
    textAlign: 'center',
  },
  primary: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    marginTop: 26,
    minHeight: 48,
    paddingHorizontal: 34,
  },
  primaryPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  primaryLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  secondary: {
    marginTop: 14,
    paddingVertical: 8,
  },
  secondaryLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.75,
  },
});
