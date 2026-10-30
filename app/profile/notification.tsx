import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ErrorState } from '@/components/EmptyState';
import { RequireAuth } from '@/components/RequireAuth';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { formatTimeLabel, TimePickerSheet } from '@/components/TimePickerSheet';
import { Toast, useToast } from '@/components/Toast';
import { PassageColors } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useNotificationSettings, useRegisterPushDevice, useUpdateNotificationSettings } from '@/hooks/usePreferences';
import type { NotificationSettings } from '@/lib/api/preferences';
import {
  getLocalSetting,
  LOCAL_SETTING_KEYS,
  REMINDER_TIME_DEFAULT,
  setLocalSetting,
} from '@/lib/local-settings';
import {
  cancelWindDownReminder,
  requestNotificationPermission,
  scheduleWindDownReminder,
} from '@/lib/notifications';

/**
 * R-07. Reads and writes `GET/PUT /api/preferences/notifications`.
 *
 * This screen previously called `/api/notifications` for both the read and the
 * write. No such route exists — notification settings are served by the
 * Notifications controller under the `/api/preferences` prefix, alongside sound
 * and playback settings.
 *
 * `user_notification_settings` has no column for the reminder time, so the hour
 * is kept on the device and drives the locally scheduled reminder. The server
 * only needs to know whether reminders are on.
 */
function NotificationContent() {
  const { notice, showToast } = useToast();
  const { data: settings, isInitialLoading, isError, refetch } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const { registerDevice } = useRegisterPushDevice();

  const [reminderTime, setReminderTime] = useState(REMINDER_TIME_DEFAULT);
  const [timeSheetVisible, setTimeSheetVisible] = useState(false);

  useEffect(() => {
    let active = true;

    void getLocalSetting(LOCAL_SETTING_KEYS.reminderTime, REMINDER_TIME_DEFAULT).then((value) => {
      if (active) setReminderTime(value);
    });

    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(
    (patch: Partial<NotificationSettings>) => {
      update.mutate(patch, {
        onError: () => showToast('Could not save that. Try again.'),
      });
    },
    [showToast, update]
  );

  /**
   * Turning anything on needs a device the server can reach, so the push token
   * is registered at that moment rather than at launch. The preference is saved
   * either way — a declined permission means no push, not a failed setting.
   */
  const enableChannel = useCallback(
    async (patch: Partial<NotificationSettings>) => {
      save(patch);

      const granted = await requestNotificationPermission();
      if (!granted) {
        showToast('Turn on notifications for Passage in your device settings.');
        return false;
      }

      const registered = await registerDevice();
      if (!registered) {
        showToast('Saved. This device could not be registered for push yet.');
      }

      return true;
    },
    [registerDevice, save, showToast]
  );

  const handleReminders = useCallback(
    async (value: boolean) => {
      if (!value) {
        save({ reminders_enabled: false });
        await cancelWindDownReminder();
        return;
      }

      const granted = await enableChannel({ reminders_enabled: true });
      if (granted) await scheduleWindDownReminder(reminderTime);
    },
    [enableChannel, reminderTime, save]
  );

  const handleReminderTime = useCallback(
    async (value: string) => {
      setReminderTime(value);
      await setLocalSetting(LOCAL_SETTING_KEYS.reminderTime, value);

      if (settings?.reminders_enabled) {
        const scheduled = await scheduleWindDownReminder(value);
        showToast(
          scheduled ? `Reminder set for ${formatTimeLabel(value)}.` : 'Reminder time saved.'
        );
      }
    },
    [settings?.reminders_enabled, showToast]
  );

  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={PassageColors.accent} />
        </View>
      );
    }

    if (isError || !settings) {
      return <ErrorState onRetry={() => void refetch()} />;
    }

    return (
      <>
        <Text style={styles.explainer}>All notifications are off by default.</Text>

        <SettingsGroup>
          <SettingsRow
            description="One quiet nudge in the evening."
            icon="moon-outline"
            label="Wind-down reminders"
            toggle={{
              value: settings.reminders_enabled,
              onValueChange: (value) => void handleReminders(value),
            }}
          />

          {settings.reminders_enabled ? (
            <SettingsRow
              icon="time-outline"
              label="Reminder time"
              onPress={() => setTimeSheetVisible(true)}
              value={formatTimeLabel(reminderTime)}
            />
          ) : null}

          <SettingsRow
            description="When a new collection is added to the catalogue."
            icon="albums-outline"
            label="New collection alerts"
            toggle={{
              value: settings.new_collection_alerts,
              onValueChange: (value) => {
                if (value) {
                  void enableChannel({ new_collection_alerts: true });
                } else {
                  save({ new_collection_alerts: false });
                }
              },
            }}
          />
        </SettingsGroup>

        <Text style={styles.footnote}>
          Reminders are scheduled on this device. Collection alerts are sent from Passage, so
          this device is registered for push when you turn one on.
        </Text>

        <TimePickerSheet
          onClose={() => setTimeSheetVisible(false)}
          onSelect={(value) => void handleReminderTime(value)}
          value={reminderTime}
          visible={timeSheetVisible}
        />
      </>
    );
  };

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/notifications-top-georgian-bell-realistic-v2.webp')}
      overlay={<Toast bottom={72} notice={notice} />}
      subtitle="Nothing arrives unless you ask for it."
      title="Notifications">
      {renderBody()}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 64,
  },
  explainer: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  footnote: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 4,
  },
});

/**
 * The gate renders NotificationContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function NotificationScreen() {
  return (
    <RequireAuth message="Notification settings are saved to your account.">
      <NotificationContent />
    </RequireAuth>
  );
}
