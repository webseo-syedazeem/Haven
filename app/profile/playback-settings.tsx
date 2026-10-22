import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ErrorState } from '@/components/EmptyState';
import { OptionSheet, type SheetOption } from '@/components/OptionSheet';
import { RequireAuth } from '@/components/RequireAuth';
import { SettingsGroup, SettingsRow } from '@/components/SettingsRow';
import { SettingsScreen } from '@/components/SettingsScreen';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors } from '@/constants/design';
import { usePlaybackSettings, useUpdatePlaybackSettings } from '@/hooks/usePreferences';
import type { PlaybackSettings } from '@/lib/api/preferences';

/** `default_timer_minutes` is a nullable integer; null means "no timer". */
const TIMER_OPTIONS: readonly SheetOption<number | null>[] = [
  { value: null, label: 'No timer', description: 'Playback runs until you stop it.' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1 hour 30' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
];

function timerLabel(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'No timer';
  return TIMER_OPTIONS.find((option) => option.value === minutes)?.label ?? `${minutes} min`;
}

/** R-05. Every control maps to a column on `user_playback_settings`. */
function PlaybackSettingsContent() {
  const { notice, showToast } = useToast();
  const { data: settings, isInitialLoading, isError, refetch } = usePlaybackSettings();
  const update = useUpdatePlaybackSettings();

  const [timerSheetVisible, setTimerSheetVisible] = useState(false);

  const save = useCallback(
    (patch: Partial<PlaybackSettings>) => {
      update.mutate(patch, {
        onError: () => showToast('Could not save that. Try again.'),
      });
    },
    [showToast, update]
  );

  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={HalcyonColors.accent} />
        </View>
      );
    }

    if (isError || !settings) {
      return <ErrorState onRetry={() => void refetch()} />;
    }

    return (
      <>
        <SettingsGroup title="While listening">
          <SettingsRow
            description="Keep playing when the screen locks or you leave the app."
            icon="phone-portrait-outline"
            label="Background playback"
            toggle={{
              value: settings.background_playback,
              onValueChange: (value) => save({ background_playback: value }),
            }}
          />
          <SettingsRow
            description="Move on to the next soundscape when one finishes."
            icon="play-skip-forward-outline"
            label="Autoplay next"
            toggle={{
              value: settings.autoplay_next,
              onValueChange: (value) => save({ autoplay_next: value }),
            }}
          />
          <SettingsRow
            description="Ease the volume down when a sleep timer ends."
            icon="trending-down-outline"
            label="Fade out at end"
            toggle={{
              value: settings.fade_enabled,
              onValueChange: (value) => save({ fade_enabled: value }),
            }}
          />
        </SettingsGroup>

        <SettingsGroup
          footnote="The default timer is applied when you start something new. You can always change it from the player."
          title="Defaults">
          <SettingsRow
            icon="timer-outline"
            label="Default sleep timer"
            onPress={() => setTimerSheetVisible(true)}
            value={timerLabel(settings.default_timer_minutes)}
          />
        </SettingsGroup>

        <OptionSheet
          onClose={() => setTimerSheetVisible(false)}
          onSelect={(value) => save({ default_timer_minutes: value })}
          options={TIMER_OPTIONS}
          title="Default sleep timer"
          value={settings.default_timer_minutes}
          visible={timerSheetVisible}
        />

      </>
    );
  };

  return (
    <SettingsScreen
      backgroundImage={require('@/assets/images/playback-top-lake-realistic-final.webp')}
      overlay={<Toast bottom={72} notice={notice} />}
      subtitle="How Passage behaves while something is playing."
      title="Playback">
      {renderBody()}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 64,
  },
});

/**
 * The gate renders PlaybackSettingsContent only once there is a session, so a deep link
 * here while signed out shows the prompt instead of firing a request that can
 * only come back 401.
 */
export default function PlaybackSettingsScreen() {
  return (
    <RequireAuth message="Playback settings are saved to your account.">
      <PlaybackSettingsContent />
    </RequireAuth>
  );
}
