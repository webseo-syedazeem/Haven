import { Platform } from 'react-native';

export async function requestNotificationPermission(): Promise<boolean> {
  if (__DEV__ || Platform.OS === 'web') return false;
  const Notifications = require('expo-notifications');
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
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
  await Notifications.cancelAllScheduledNotificationsAsync();

  const NOTIFICATION_CONFIG: Record<string, { title: string; body: string }> = {
    morning_reminder: { title: '🌅 Good Morning!', body: 'Start your day with a calming moment.' },
    mood_checkin: { title: '💜 Mood Check-in', body: 'How are you feeling right now?' },
    checklist_reminder: { title: '✅ Daily Checklist', body: 'Complete your daily wellness checklist.' },
    evening_wind_down: { title: '🌙 Wind Down Time', body: 'Time to relax and prepare for rest.' },
    soundscape_reminder: { title: '🎵 Soundscape Time', body: 'Listen to calming sounds and unwind.' },
  };

  const keys = ['morning_reminder','mood_checkin','checklist_reminder','evening_wind_down','soundscape_reminder'];

  for (const key of keys) {
    if (!notifState[key]) continue;
    const config = NOTIFICATION_CONFIG[key];
    if (!config) continue;
    const timeKey = `${key}_time`;
    const timeStr = notifState[timeKey] ?? '09:00';
    const [h, m] = timeStr.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: { title: config.title, body: config.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h ?? 9,
        minute: m ?? 0,
      },
    });
  }
}
