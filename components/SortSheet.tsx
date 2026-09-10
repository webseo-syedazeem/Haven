import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HalcyonColors, HalcyonSpacing } from '@/constants/design';
import { SORT_OPTIONS, type SortValue } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';

type SortSheetProps = {
  visible: boolean;
  value: SortValue;
  onClose: () => void;
  onSelect: (value: SortValue) => void;
};

/** The nine sort values `/api/library` accepts, and nothing else. */
export function SortSheet({ visible, value, onClose, onSelect }: SortSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Close sort" onPress={onClose} style={styles.backdrop} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort by</Text>
          <Pressable
            accessibilityLabel="Close sort"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}>
            <Ionicons color={HalcyonColors.textPrimary} name="close" size={22} />
          </Pressable>
        </View>

        {SORT_OPTIONS.map((option) => {
          const isActive = option.value === value;

          return (
            <Pressable
              accessibilityLabel={option.label}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <Text style={[styles.label, isActive && styles.labelActive]}>{option.label}</Text>
              {isActive && (
                <Ionicons color={HalcyonColors.accent} name="checkmark" size={19} />
              )}
            </Pressable>
          );
        })}
      </View>
    </Modal>
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  rowPressed: {
    opacity: 0.7,
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
});
