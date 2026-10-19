import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HalcyonColors, RELAX_ACCENT } from '@/constants/design';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';

type RelaxChoiceRowProps = {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  selected: boolean;
};

/** Shared option row for the three Relax question screens. */
export function RelaxChoiceRow({
  disabled = false,
  icon,
  label,
  onPress,
  selected,
}: RelaxChoiceRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        disabled && styles.rowDisabled,
        pressed && !disabled && styles.pressed,
      ]}>
      <View style={styles.icon}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.indicator, selected && styles.indicatorSelected]}>
        {selected ? (
          <Ionicons color={HalcyonColors.background} name="checkmark" size={14} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    height: RELAX_ONBOARDING.optionRow.iconSize,
    justifyContent: 'center',
    width: RELAX_ONBOARDING.optionRow.iconSize,
  },
  indicator: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: RELAX_ONBOARDING.optionRow.indicatorSize / 2,
    borderWidth: 1,
    height: RELAX_ONBOARDING.optionRow.indicatorSize,
    justifyContent: 'center',
    width: RELAX_ONBOARDING.optionRow.indicatorSize,
  },
  indicatorSelected: {
    backgroundColor: RELAX_ACCENT,
    borderColor: RELAX_ACCENT,
  },
  label: {
    color: HalcyonColors.textPrimary,
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: RELAX_ONBOARDING.optionRow.labelFontSize,
    fontWeight: '500',
    lineHeight: RELAX_ONBOARDING.optionRow.labelLineHeight,
  },
  pressed: {
    opacity: 0.76,
  },
  rowDisabled: {
    opacity: 0.32,
  },
  row: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,31,29,0.68)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: RELAX_ONBOARDING.optionRow.borderRadius,
    borderWidth: 1,
    columnGap: 12,
    flexDirection: 'row',
    minHeight: RELAX_ONBOARDING.optionRow.minHeight,
    paddingHorizontal: RELAX_ONBOARDING.optionRow.paddingHorizontal,
    paddingVertical: RELAX_ONBOARDING.optionRow.paddingVertical,
  },
  rowSelected: {
    borderColor: RELAX_ACCENT,
    shadowColor: RELAX_ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
});
