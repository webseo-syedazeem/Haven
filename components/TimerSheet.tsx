import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
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
  formatTimerCountdown,
  getTimerConfig,
  TIMER_MAX_MINUTES,
  TIMER_MIN_MINUTES,
  TIMER_STEP_MINUTES,
  UNTIL_I_STOP,
  type TimerSelection,
} from '@/constants/timers';
import { AppFonts } from '@/constants/theme';

type TimerSheetProps = {
  visible: boolean;
  mode?: ModeId | string | null;
  selection: TimerSelection | null;
  /** True while audio is buffering and a numeric timer is waiting to start. */
  isLoading?: boolean;
  /** True while playback is paused and a numeric timer is frozen, not ticking. */
  isPaused?: boolean;
  /** The frozen (while paused) or live countdown, in seconds. */
  remainingSeconds?: number | null;
  onSelect: (selection: TimerSelection | null) => void;
  onClose: () => void;
};

function clampDuration(value: number): number {
  return Math.min(TIMER_MAX_MINUTES, Math.max(TIMER_MIN_MINUTES, value));
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    : `${hours} hr ${remainingMinutes} min`;
}

/** A flexible sleep timer with a draggable 5 minute–8 hour range. */
export function TimerSheet({
  visible,
  mode,
  selection,
  isLoading = false,
  isPaused = false,
  remainingSeconds = null,
  onSelect,
  onClose,
}: TimerSheetProps) {
  const insets = useSafeAreaInsets();
  const config = getTimerConfig(mode);
  const modeLabel = getModeLabel(mode) || 'This mode';
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [timerMode, setTimerMode] = useState<'duration' | 'until-stop'>('duration');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (selection === UNTIL_I_STOP) {
      setTimerMode('until-stop');
    } else {
      setTimerMode('duration');
      if (typeof selection === 'number') setDurationMinutes(clampDuration(selection));
    }
    setDropdownOpen(false);
  }, [selection, visible]);

  const endingNote =
    config.ending.type === 'fade'
      ? `${modeLabel} sessions fade out over the last minute, then end in silence.`
      : `${modeLabel} sessions stop quietly when the time is up.`;
  const statusNote =
    remainingSeconds === null
      ? null
      : isLoading
        ? `Loading, ${formatTimerCountdown(remainingSeconds)} left`
        : isPaused
          ? `Paused, ${formatTimerCountdown(remainingSeconds)} left`
          : null;
  const selectedValue = timerMode === 'until-stop' ? UNTIL_I_STOP : durationMinutes;

  return (
    <Modal
      animationType="slide"
      navigationBarTranslucent
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.container}>
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

          {!!statusNote && <Text style={styles.pausedNote}>{statusNote}</Text>}

          <Text style={styles.fieldLabel}>Timer mode</Text>
          <Pressable
            accessibilityLabel="Choose timer mode"
            accessibilityRole="button"
            accessibilityState={{ expanded: dropdownOpen }}
            onPress={() => setDropdownOpen((current) => !current)}
            style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}>
            <Text style={styles.dropdownLabel}>
              {timerMode === 'duration' ? 'Set a duration' : 'Until I Stop'}
            </Text>
            <Ionicons
              color={HalcyonColors.textSecondary}
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
            />
          </Pressable>

          {dropdownOpen && (
            <View style={styles.dropdownMenu}>
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => {
                  setTimerMode('duration');
                  setDropdownOpen(false);
                }}
                style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}>
                <Text style={styles.dropdownOptionLabel}>Set a duration</Text>
                {timerMode === 'duration' && (
                  <Ionicons color={HalcyonColors.accent} name="checkmark" size={19} />
                )}
              </Pressable>
              <Pressable
                accessibilityRole="menuitem"
                onPress={() => {
                  setTimerMode('until-stop');
                  setDropdownOpen(false);
                }}
                style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}>
                <Text style={styles.dropdownOptionLabel}>Until I Stop</Text>
                {timerMode === 'until-stop' && (
                  <Ionicons color={HalcyonColors.accent} name="checkmark" size={19} />
                )}
              </Pressable>
            </View>
          )}

          {timerMode === 'duration' ? (
            <View style={styles.timelineSection}>
              <Text accessibilityLiveRegion="polite" style={styles.durationValue}>
                {formatDuration(durationMinutes)}
              </Text>
              <Text style={styles.durationHint}>Drag to choose when playback should stop.</Text>
              <Slider
                accessibilityLabel="Timer duration"
                accessibilityValue={{
                  min: TIMER_MIN_MINUTES,
                  max: TIMER_MAX_MINUTES,
                  now: durationMinutes,
                  text: formatDuration(durationMinutes),
                }}
                maximumTrackTintColor="rgba(255,255,255,0.14)"
                maximumValue={TIMER_MAX_MINUTES}
                minimumTrackTintColor={HalcyonColors.accent}
                minimumValue={TIMER_MIN_MINUTES}
                onValueChange={(value) => setDurationMinutes(Math.round(value))}
                step={TIMER_STEP_MINUTES}
                style={styles.slider}
                thumbTintColor={HalcyonColors.accent}
                value={durationMinutes}
              />
              <View style={styles.timelineLabels}>
                <Text style={styles.timelineLabel}>5 min</Text>
                <Text style={styles.timelineLabel}>4 hr</Text>
                <Text style={styles.timelineLabel}>8 hr</Text>
              </View>
            </View>
          ) : (
            <View style={styles.untilStopCard}>
              <Ionicons color={HalcyonColors.accent} name="infinite-outline" size={24} />
              <View style={styles.untilStopCopy}>
                <Text style={styles.untilStopTitle}>No time limit</Text>
                <Text style={styles.untilStopHint}>Playback continues until you stop it.</Text>
              </View>
            </View>
          )}

          <Text style={styles.note}>{endingNote}</Text>

          <Pressable
            accessibilityLabel={timerMode === 'until-stop' ? 'Set until I stop' : `Set ${formatDuration(durationMinutes)} timer`}
            accessibilityRole="button"
            onPress={() => onSelect(selectedValue)}
            style={({ pressed }) => [styles.applyButton, pressed && styles.pressed]}>
            <Text style={styles.applyLabel}>Set timer</Text>
          </Pressable>

          {selection !== null && (
            <Pressable
              accessibilityLabel="Turn timer off"
              accessibilityRole="button"
              onPress={() => onSelect(null)}
              style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
              <Text style={styles.clearLabel}>Turn timer off</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: HalcyonModal.backdrop },
  sheet: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: 'rgba(255,255,255,0.035)',
    borderTopLeftRadius: HalcyonRadius.sheet,
    borderTopRightRadius: HalcyonRadius.sheet,
    borderTopWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
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
  title: { ...Typography.sectionHeading },
  pausedNote: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginBottom: 14,
  },
  fieldLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.4,
    lineHeight: 18,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  dropdown: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownMenu: {
    backgroundColor: HalcyonColors.background,
    borderColor: HalcyonColors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownOption: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  dropdownOptionLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  timelineSection: { marginTop: 22 },
  durationValue: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  durationHint: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'center',
  },
  slider: { height: 42, marginHorizontal: -4, marginTop: 10 },
  timelineLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  timelineLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
  },
  untilStopCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderRadius: 16,
    columnGap: 14,
    flexDirection: 'row',
    marginTop: 20,
    minHeight: 82,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  untilStopCopy: { flex: 1 },
  untilStopTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  untilStopHint: {
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
  applyButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 50,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  applyLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  clearButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 44,
    paddingVertical: 10,
  },
  clearLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  pressed: { opacity: 0.82 },
});
