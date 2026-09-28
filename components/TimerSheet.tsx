import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  HalcyonColors,
  HalcyonModal,
  HalcyonRadius,
  HalcyonSpacing,
  Typography,
} from '@/constants/design';
import { getModeLabel, type ModeId } from '@/constants/modes';
import {
  getTimerConfig,
  UNTIL_I_STOP,
  type TimerSelection,
} from '@/constants/timers';
import { AppFonts } from '@/constants/theme';

type TimerSheetProps = {
  visible: boolean;
  mode?: ModeId | string | null;
  selection: TimerSelection | null;
  endToneEnabled: boolean;
  onSelect: (selection: TimerSelection | null) => void;
  onToggleEndTone: (enabled: boolean) => void;
  onClose: () => void;
};

/** Mode aware sleep timer, driven entirely by `constants/timers.ts`. */
export function TimerSheet({
  visible,
  mode,
  selection,
  endToneEnabled,
  onSelect,
  onToggleEndTone,
  onClose,
}: TimerSheetProps) {
  const insets = useSafeAreaInsets();
  const config = getTimerConfig(mode);
  const modeLabel = getModeLabel(mode) || 'This mode';

  const endingNote =
    config.ending.type === 'fade'
      ? `${modeLabel} sessions fade out over the last minute, then end in silence.`
      : `${modeLabel} sessions stop quietly when the time is up.`;

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <Pressable accessibilityLabel="Close timer" onPress={onClose} style={styles.backdrop} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.title}>Timer</Text>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onClose}>
            <Ionicons color={HalcyonColors.textSecondary} name="close" size={20} />
          </Pressable>
        </View>

        <View style={styles.options}>
          {config.presets.map((preset) => {
            const isSelected = selection === preset.value;

            return (
              <Pressable
                accessibilityLabel={preset.label}
                accessibilityRole="button"
                accessibilityState={isSelected ? { selected: true } : {}}
                key={String(preset.value)}
                onPress={() => onSelect(preset.value)}
                style={({ pressed }) => [
                  styles.option,
                  preset.value === UNTIL_I_STOP && styles.optionWide,
                  isSelected && styles.optionSelected,
                  pressed && styles.optionPressed,
                ]}>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {config.ending.type === 'silent' && (
          <View style={styles.toneRow}>
            <View style={styles.toneCopy}>
              <Text style={styles.toneLabel}>Play a gentle end tone</Text>
              <Text style={styles.toneHint}>One soft chime instead of a silent stop.</Text>
            </View>
            <Switch
              onValueChange={onToggleEndTone}
              thumbColor={endToneEnabled ? HalcyonColors.accent : '#3A3840'}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: 'rgba(195,161,122,0.35)' }}
              value={endToneEnabled}
            />
          </View>
        )}

        <Text style={styles.note}>{endingNote}</Text>

        {selection !== null && (
          <Pressable
            accessibilityLabel="Turn timer off"
            accessibilityRole="button"
            onPress={() => onSelect(null)}
            style={({ pressed }) => [styles.clearButton, pressed && styles.optionPressed]}>
            <Text style={styles.clearLabel}>Turn timer off</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: HalcyonModal.backdrop,
    flex: 1,
  },
  sheet: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: HalcyonRadius.sheet,
    borderTopRightRadius: HalcyonRadius.sheet,
    borderTopWidth: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 10,
  },
  grabber: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 3,
    height: 4,
    marginBottom: 16,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  title: {
    ...Typography.sectionHeading,
  },
  options: {
    columnGap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  option: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  optionWide: {
    flexGrow: 1,
  },
  optionSelected: {
    backgroundColor: HalcyonColors.accent,
    borderColor: HalcyonColors.accent,
  },
  optionPressed: {
    opacity: 0.82,
  },
  optionLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  optionLabelSelected: {
    color: HalcyonColors.background,
  },
  toneRow: {
    alignItems: 'center',
    borderTopColor: HalcyonColors.border,
    borderTopWidth: 1,
    columnGap: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingTop: 18,
  },
  toneCopy: {
    flex: 1,
  },
  toneLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  toneHint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  note: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
  },
  clearButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    marginTop: 18,
    paddingVertical: 14,
  },
  clearLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});
