import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  if (__DEV__ || Platform.OS === 'web') return false;
  const Notifications = require('expo-notifications');
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function ensureAndroidChannel(Notifications: any): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('steadia-reminders', {
    name: 'Steadia Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: false,
  });
}

// Returns the next Date at which hour:minute occurs (today if not yet passed, else tomorrow)
function nextOccurrence(hour: number, minute: number): Date {
  const now = new Date();
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

export async function scheduleNotifications(notifState: Record<string, any>): Promise<void> {
  if (__DEV__) return;
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await ensureAndroidChannel(Notifications);
  await Notifications.cancelAllScheduledNotificationsAsync();

  const NOTIFICATION_CONFIG: Record<string, { title: string; body: string }> = {
    morning_reminder: { title: '🌅 Good Morning!', body: 'Start your day with a calming moment.' },
    mood_checkin: { title: '💜 Mood Check-in', body: 'How are you feeling right now?' },
    checklist_reminder: { title: '✅ Daily Checklist', body: 'Complete your daily wellness checklist.' },
    evening_wind_down: { title: '🌙 Wind Down Time', body: 'Time to relax and prepare for rest.' },
    soundscape_reminder: { title: '🎵 Soundscape Time', body: 'Listen to calming sounds and unwind.' },
  };

  const keys = ['morning_reminder', 'mood_checkin', 'checklist_reminder', 'evening_wind_down', 'soundscape_reminder'];

  for (const key of keys) {
    if (!notifState[key]) continue;
    const config = NOTIFICATION_CONFIG[key];
    if (!config) continue;
    const timeStr = notifState[`${key}_time`] ?? '09:00';
    const [hStr, mStr] = timeStr.split(':');
    const hour = parseInt(hStr, 10) || 9;
    const minute = parseInt(mStr, 10) || 0;

    if (Platform.OS === 'android') {
      // Use individual DATE triggers (backed by setExactAndAllowWhileIdle) instead of DAILY.
      // setExactAndAllowWhileIdle fires at the exact millisecond even when the device is in
      // Doze mode — the root cause of the 2-minute delay with setExact-based DAILY triggers.
      // Schedule 30 days so notifications continue without requiring daily app opens.
      const first = nextOccurrence(hour, minute);
      for (let day = 0; day < 30; day++) {
        const date = new Date(first);
        date.setDate(date.getDate() + day);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: config.title,
            body: config.body,
            sound: 'default',
            channelId: 'Steadia-reminders',
            priority: Notifications.AndroidNotificationPriority?.HIGH ?? 'high',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date,
            channelId: 'Steadia-reminders',
          },
        });
      }
    } else {
      // iOS handles DAILY triggers precisely without Doze-mode concerns
      await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    }
  }
}
