import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Shows an × so the chip can remove itself from the active row. */
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function FilterChip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
}: FilterChipProps) {
  const tint = selected ? PassageColors.background : PassageColors.textPrimary;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.chipPressed,
      ]}>
      {!!icon && <Ionicons color={tint} name={icon} size={13} />}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
      {!!onRemove && (
        <Pressable
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onRemove}>
          <Ionicons color={tint} name="close" size={13} />
        </Pressable>
      )}
    </Pressable>
  );
}

/** Wrapping group of chips, used inside the filter sheet. */
export function ChipGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: PassageColors.accent,
    borderColor: PassageColors.accent,
  },
  chipPressed: {
    opacity: 0.74,
  },
  label: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  labelSelected: {
    color: PassageColors.background,
  },
  group: {
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
});
