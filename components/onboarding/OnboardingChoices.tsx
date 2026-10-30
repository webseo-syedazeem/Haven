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

import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

export function ChoiceRow({
  accentColor,
  description,
  icon,
  label,
  onPress,
  selected,
  style,
}: {
  accentColor?: string;
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
        selected && accentColor
          ? {
              borderColor: accentColor,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
            }
          : null,
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.copy}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View
        style={[
          styles.check,
          selected && styles.checkSelected,
          selected && accentColor
            ? { backgroundColor: accentColor, borderColor: accentColor }
            : null,
        ]}>
        {selected ? (
          <Ionicons color={PassageColors.background} name="checkmark" size={14} />
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
        <Ionicons color={PassageColors.background} name="checkmark" size={14} />
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
    backgroundColor: PassageColors.accent,
    borderColor: PassageColors.accent,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipLabel: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
  chipLabelSelected: {
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontWeight: '600',
  },
  chipSelected: {
    backgroundColor: PassageColors.accent,
    borderColor: PassageColors.accent,
  },
  copy: { flex: 1 },
  description: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  icon: { marginRight: 12 },
  pressed: { opacity: 0.76 },
  row: {
    alignItems: 'center',
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.card,
    borderWidth: 1,
    columnGap: 12,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  rowLabel: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  rowSelected: {
   

  },
});
