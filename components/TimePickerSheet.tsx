import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SheetFrame } from '@/components/OptionSheet';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = [0, 15, 30, 45];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatTimeLabel(value: string): string {
  const [hour, minute] = parseTime(value);
  return `${pad(hour)}:${pad(minute)}`;
}

function parseTime(value: string): [number, number] {
  const [rawHour, rawMinute] = (value ?? '').split(':');
  const hour = Number.parseInt(rawHour ?? '', 10);
  const minute = Number.parseInt(rawMinute ?? '', 10);

  return [
    Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : 21,
    Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 30,
  ];
}

/** Snaps an arbitrary minute onto the quarter-hour column. */
function nearestMinute(minute: number): number {
  return MINUTES.reduce((closest, option) =>
    Math.abs(option - minute) < Math.abs(closest - minute) ? option : closest
  );
}

type TimePickerSheetProps = {
  visible: boolean;
  /** 24h "HH:MM". */
  value: string;
  title?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

/**
 * Two scrollable columns — hour and quarter hour — rather than a platform date
 * picker, because the project has no date-picker dependency and a reminder only
 * ever needs a time of day. The value is committed on "Set", so scrolling
 * through the list does not fire a write per step.
 */
export function TimePickerSheet({
  visible,
  value,
  title = 'Reminder time',
  onSelect,
  onClose,
}: TimePickerSheetProps) {
  const [hour, setHour] = useState(() => parseTime(value)[0]);
  const [minute, setMinute] = useState(() => nearestMinute(parseTime(value)[1]));

  useEffect(() => {
    if (!visible) return;
    const [nextHour, nextMinute] = parseTime(value);
    setHour(nextHour);
    setMinute(nearestMinute(nextMinute));
  }, [value, visible]);

  return (
    <SheetFrame onClose={onClose} title={title} visible={visible}>
      <View style={styles.columns}>
        <Column
          format={pad}
          label="Hour"
          onSelect={setHour}
          options={HOURS}
          selected={hour}
        />
        <Column
          format={pad}
          label="Minute"
          onSelect={setMinute}
          options={MINUTES}
          selected={minute}
        />
      </View>

      <Pressable
        accessibilityLabel={`Set reminder for ${pad(hour)}:${pad(minute)}`}
        accessibilityRole="button"
        onPress={() => {
          onSelect(`${pad(hour)}:${pad(minute)}`);
          onClose();
        }}
        style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}>
        <Text style={styles.confirmLabel}>{`Set ${pad(hour)}:${pad(minute)}`}</Text>
      </Pressable>
    </SheetFrame>
  );
}

function Column({
  label,
  options,
  selected,
  format,
  onSelect,
}: {
  label: string;
  options: number[];
  selected: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
}) {
  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{label}</Text>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.columnScroll}>
        {options.map((option) => {
          const isActive = option === selected;

          return (
            <Pressable
              accessibilityLabel={`${label} ${format(option)}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={option}
              onPress={() => onSelect(option)}
              style={({ pressed }) => [
                styles.option,
                isActive && styles.optionActive,
                pressed && styles.optionPressed,
              ]}>
              <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                {format(option)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  columns: {
    columnGap: 12,
    flexDirection: 'row',
    marginTop: 8,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    lineHeight: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  columnScroll: {
    height: 210,
  },
  option: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  optionActive: {
    backgroundColor: HalcyonColors.accent,
  },
  optionPressed: {
    opacity: 0.72,
  },
  optionLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  optionLabelActive: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontWeight: '600',
  },
  confirm: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 50,
  },
  confirmPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  confirmLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
