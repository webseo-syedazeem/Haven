import { Platform } from 'react-native';

/**
 * Local notification plumbing for the wind-down reminder.
 *
 * `expo-notifications` is required lazily so the module never loads on web and
 * never brings the app down in a client where the native module is missing.
 * Every function here fails quietly: a device that will not schedule simply
 * receives no reminder, and the preference the user set is still saved.
 */

const REMINDER_CHANNEL_ID = 'passage-reminders';

const REMINDER_CONTENT = {
  title: 'Time to wind down',
  body: 'A few quiet minutes before bed.',
};

function loadNotifications(): any | null {
  if (Platform.OS === 'web') return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications');
  } catch {
    return null;
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;

  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch {
    return false;
  }
}

async function ensureAndroidChannel(Notifications: any): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Passage Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}

/** Parses "HH:MM" into numbers, falling back to a sensible evening slot. */
function parseTime(value: string): { hour: number; minute: number } {
  const [rawHour, rawMinute] = (value ?? '').split(':');
  const hour = Number.parseInt(rawHour ?? '', 10);
  const minute = Number.parseInt(rawMinute ?? '', 10);

  return {
    hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : 21,
    minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 30,
  };
}

export async function cancelWindDownReminder(): Promise<void> {
  const Notifications = loadNotifications();
  if (!Notifications) return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Nothing scheduled, or the module is unavailable in this client.
  }
}

/**
 * Schedules one repeating daily reminder at `time` ("HH:MM"), replacing any
 * previously scheduled one. The wind-down reminder is the only notification the
 * app schedules locally, so cancelling everything first is safe.
 */
export async function scheduleWindDownReminder(time: string): Promise<boolean> {
  const Notifications = loadNotifications();
  if (!Notifications) return false;

  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    await ensureAndroidChannel(Notifications);
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { hour, minute } = parseTime(time);

    await Notifications.scheduleNotificationAsync({
      content: {
        ...REMINDER_CONTENT,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL_ID } : {}),
      },
    });

    return true;
  } catch {
    return false;
  }
}
