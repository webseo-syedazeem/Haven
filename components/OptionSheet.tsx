import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HalcyonColors, HalcyonSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

/** The bottom sheet shell every settings picker uses. */
export function SheetFrame({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.backdrop} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}>
            <Ionicons color={HalcyonColors.textPrimary} name="close" size={22} />
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  );
}

export type SheetOption<T extends string | number | null> = {
  value: T;
  label: string;
  /** Muted second line, for the option whose effect is not obvious. */
  description?: string;
};

type OptionSheetProps<T extends string | number | null> = {
  visible: boolean;
  title: string;
  /** `null` selects nothing — used when the sheet is a menu rather than a choice. */
  value: T | null;
  options: readonly SheetOption<T>[];
  onSelect: (value: T) => void;
  onClose: () => void;
};

/**
 * A single-select list in a bottom sheet — the picker behind every "value" row
 * in settings. Selecting closes the sheet, so a choice is one tap.
 */
export function OptionSheet<T extends string | number | null>({
  visible,
  title,
  value,
  options,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  return (
    <SheetFrame onClose={onClose} title={title} visible={visible}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={String(option.value)}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <View style={styles.rowCopy}>
                <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
                {!!option.description && (
                  <Text style={styles.description}>{option.description}</Text>
                )}
              </View>
              {isActive && <Ionicons color={HalcyonColors.accent} name="checkmark" size={19} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4,4,6,0.62)',
    flex: 1,
  },
  sheet: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '78%',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
  },
  list: {
    flexGrow: 0,
  },
  row: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 6,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowCopy: {
    flex: 1,
  },
  label: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
  labelActive: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
});
