export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type UkWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

const UK_WEEKDAYS: Record<string, UkWeekday> = {
  Mon: 'monday',
  Tue: 'tuesday',
  Wed: 'wednesday',
  Thu: 'thursday',
  Fri: 'friday',
  Sat: 'saturday',
  Sun: 'sunday',
};

function timeOfDayForHour(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

/** The current part of the day in London, including GMT/BST changes. */
export function getUkTimeOfDay(date = new Date()): TimeOfDay {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: 'numeric',
      hour12: false,
      hourCycle: 'h23',
    }).format(date)
  );

  return timeOfDayForHour(hour);
}

export function getUkGreeting(date = new Date()): string {
  return `Good ${getUkTimeOfDay(date)}`;
}

/** The weekday in London, so the Home artwork changes at UK midnight. */
export function getUkWeekday(date = new Date()): UkWeekday {
  const weekday = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
  }).format(date);

  return UK_WEEKDAYS[weekday] ?? 'monday';
}

/** Time of day from the device clock, for non-UK-specific UI. */
export function getTimeOfDay(date = new Date()): TimeOfDay {
  return timeOfDayForHour(date.getHours());
}
