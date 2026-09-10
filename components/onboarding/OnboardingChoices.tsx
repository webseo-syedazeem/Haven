import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

export function ChoiceRow({
  description,
  icon,
  label,
  onPress,
  selected,
  style,
}: {
  description?: string;
  icon?: ReactNode;
  label: string;
  onPress: () => void;
  selected: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected ? (
          <Ionicons color={HalcyonColors.background} name="checkmark" size={14} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function ChoiceChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && styles.pressed,
      ]}>
      {selected ? (
        <Ionicons color={HalcyonColors.background} name="checkmark" size={14} />
      ) : null}
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  check: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  checkSelected: {
    backgroundColor: HalcyonColors.accent,
    borderColor: HalcyonColors.accent,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  chipLabelSelected: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontWeight: '600',
  },
  chipSelected: {
    backgroundColor: HalcyonColors.accent,
    borderColor: HalcyonColors.accent,
  },
  copy: { flex: 1 },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  icon: { marginRight: 12 },
  pressed: { opacity: 0.76 },
  row: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    columnGap: 12,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  rowSelected: {
   

  },
});
