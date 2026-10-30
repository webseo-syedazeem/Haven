import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  PassageColors,
  PassageModal,
  PassageRadius,
  PassageSpacing,
  Typography,
} from '@/constants/design';
import { SORT_OPTIONS, type SortValue } from '@/constants/filters';
import { AppFonts } from '@/constants/theme';

type SortSheetProps = {
  visible: boolean;
  value: SortValue;
  onClose: () => void;
  onSelect: (value: SortValue) => void;
};

/** User-facing Library sort choices. */
export function SortSheet({ visible, value, onClose, onSelect }: SortSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.container}>
        <Pressable accessibilityLabel="Close sort" onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Sort by</Text>
          <Pressable
            accessibilityLabel="Close sort"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}>
            <Ionicons color={PassageColors.textPrimary} name="close" size={22} />
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
                <Ionicons color={PassageColors.accent} name="checkmark" size={19} />
              )}
            </Pressable>
          );
        })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PassageModal.backdrop,
  },
  sheet: {
    backgroundColor: PassageColors.surface,
    borderTopColor: PassageColors.border,
    borderTopLeftRadius: PassageRadius.sheet,
    borderTopRightRadius: PassageRadius.sheet,
    borderTopWidth: 1,
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    ...Typography.sectionHeading,
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
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
  labelActive: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
  },
});
