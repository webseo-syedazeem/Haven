import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { useHasSession } from '@/hooks/useSession';
import {
  preferencesApi,
  type DevicePlatform,
  type NotificationSettings,
  type PlaybackSettings,
  type SoundPreferences,
} from '@/lib/api/preferences';

/**
 * Every settings screen reads and writes through here, so one cache holds the
 * three preference rows and a toggle flipped on one screen is already correct
 * on the next.
 *
 * The playback and notification toggles write straight through in the same
 * shape as `useToggleFavourite`: patch the cache, roll back on failure, and
 * let the caller show a toast from `onError`. The API merges partial bodies
 * server side, so those mutations only ever send the fields they changed.
 *
 * The sound preference chips need more than that — see
 * `useOptimisticSoundPreferences`.
 */
export const PREFERENCES_QUERY_KEYS = {
  sound: ['preferences', 'sound'] as const,
  playback: ['preferences', 'playback'] as const,
  notifications: ['preferences', 'notifications'] as const,
};

// ── Sound preferences (R-03, R-04) ───────────────────────────────────────────

export function useSoundPreferences() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PREFERENCES_QUERY_KEYS.sound,
    queryFn: preferencesApi.getSound,
    enabled: hasSession,
  });
}

// ── Optimistic sound preference chips (R-03, R-04) ───────────────────────────
//
// Both chip screens drive their chips from local state and save on a debounce.
// `PUT /api/preferences/sound` is a whole-row write for them: the body carries
// every field the row holds, built from the latest local state, so the screen
// that does not own `excluded_sounds` still sends it back untouched and neither
// screen can clip the other's fields.

/** How long the chips stay quiet before one PUT carries every recent tap. */
const SOUND_SAVE_DEBOUNCE_MS = 600;

/**
 * The body for a whole-row save, built from the latest local state.
 *
 * `detail_preference` and `intensity_preference` are left out when null: the
 * controller validates them against a fixed list and a 1–5 range with no case
 * for null, so including them would 400 the entire write — and a 400 here would
 * roll back every other chip in the same batch. Omitting a key is safe for
 * everything else, because the controller merges the body over the stored row.
 *
 * KNOWN GAP: that also means clearing a detail preference cannot reach the
 * server — the chip clears locally and comes back on the next fetch. Fixing it
 * needs the controller to accept `detail_preference: null`.
 */
function soundPreferencePayload(next: SoundPreferences): Partial<SoundPreferences> {
  const payload: Partial<SoundPreferences> = {
    preferred_environments: next.preferred_environments,
    preferred_sounds: next.preferred_sounds,
    preferred_animals: next.preferred_animals,
    preferred_instruments: next.preferred_instruments,
    excluded_sounds: next.excluded_sounds,
    typical_duration: next.typical_duration,
  };

  if (next.detail_preference !== null) payload.detail_preference = next.detail_preference;
  if (next.intensity_preference !== null) payload.intensity_preference = next.intensity_preference;

  return payload;
}

/** Reads the current row and returns the fields to change. */
export type SoundPreferenceUpdater = (current: SoundPreferences) => Partial<SoundPreferences>;

/**
 * Instant chips, one request.
 *
 * `apply` writes the new row to local state and to the query cache the moment
 * a chip is tapped, so what the chip shows never waits on the network, and a
 * background refetch cannot repaint a selection the user is still making. The
 * save itself is debounced, so a burst of taps leaves as a single PUT carrying
 * the final state.
 *
 * A success deliberately writes nothing back: the chips already show that
 * selection, or a newer one, so repainting them could only ever be a flicker.
 * Only a failure moves the UI, back to the last row the server confirmed, and
 * only when no newer tap is already on its way — a stale response never wins
 * over newer local state.
 */
export function useOptimisticSoundPreferences({
  onSaveError,
  debounceMs = SOUND_SAVE_DEBOUNCE_MS,
}: {
  /** Called when a save failed and the chips were rolled back. */
  onSaveError?: () => void;
  debounceMs?: number;
} = {}) {
  const queryClient = useQueryClient();
  const { data, isInitialLoading, isError, refetch } = useSoundPreferences();

  const [local, setLocal] = useState<SoundPreferences | null>(null);
  const localRef = useRef<SoundPreferences | null>(null);
  /** The last row the server acknowledged — where a failed save rolls back to. */
  const confirmedRef = useRef<SoundPreferences | null>(null);
  /** Bumped by every tap; compared against `savedEditRef` to spot stale work. */
  const editRef = useRef(0);
  const savedEditRef = useRef(0);
  const inFlightRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const mutation = useMutation({
    mutationFn: (payload: Partial<SoundPreferences>) => preferencesApi.updateSound(payload),
  });

  const mutateRef = useRef(mutation.mutateAsync);
  mutateRef.current = mutation.mutateAsync;

  const onSaveErrorRef = useRef(onSaveError);
  onSaveErrorRef.current = onSaveError;

  const writeLocal = useCallback(
    (next: SoundPreferences) => {
      localRef.current = next;
      // Kept in the cache too, so any other screen reading these preferences
      // sees the same row without a round trip.
      queryClient.setQueryData(PREFERENCES_QUERY_KEYS.sound, next);
      if (mountedRef.current) setLocal(next);
    },
    [queryClient]
  );

  const flush = useCallback(async () => {
    // One request at a time: the body is the whole row, so two writes in the
    // air together could land out of order. Taps made mid-flight go out on the
    // next pass of the loop below instead.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      while (localRef.current && editRef.current !== savedEditRef.current) {
        const snapshot = localRef.current;
        const editAtSend = editRef.current;

        try {
          confirmedRef.current = await mutateRef.current(soundPreferencePayload(snapshot));
          savedEditRef.current = editAtSend;
        } catch {
          if (editRef.current !== editAtSend) {
            // Tapped again while this was in the air. Send the newer state
            // rather than yanking the chips back from under the user.
            continue;
          }

          // Nothing newer is waiting, so the chips are showing a selection the
          // server never took. Put the last confirmed row back and say so.
          if (confirmedRef.current) writeLocal(confirmedRef.current);
          savedEditRef.current = editRef.current;
          if (mountedRef.current) onSaveErrorRef.current?.();
          break;
        }
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [writeLocal]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (!timerRef.current) return;

      // Leaving the screen must not drop a tap still inside the debounce
      // window. The request outlives the component; the cache write does too.
      clearTimeout(timerRef.current);
      timerRef.current = null;
      void flushRef.current();
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    // Hydrate from the server only when nothing is unsaved or in flight, so a
    // refetch can never overwrite a selection in progress.
    if (inFlightRef.current || editRef.current !== savedEditRef.current) return;

    confirmedRef.current = data;
    localRef.current = data;
    setLocal(data);
  }, [data]);

  const apply = useCallback(
    (updater: SoundPreferenceUpdater) => {
      const current =
        localRef.current ??
        queryClient.getQueryData<SoundPreferences>(PREFERENCES_QUERY_KEYS.sound);
      if (!current) return;

      editRef.current += 1;
      writeLocal({ ...current, ...updater(current) });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void flushRef.current();
      }, debounceMs);
    },
    [debounceMs, queryClient, writeLocal]
  );

  return {
    /** Local state first, so a chip reflects a tap on the very next frame. */
    preferences: local ?? data,
    isInitialLoading,
    isError,
    refetch,
    apply,
  };
}

// ── Playback settings (R-05) ─────────────────────────────────────────────────

export function usePlaybackSettings() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PREFERENCES_QUERY_KEYS.playback,
    queryFn: preferencesApi.getPlayback,
    enabled: hasSession,
  });
}

export function useUpdatePlaybackSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<PlaybackSettings>) => preferencesApi.updatePlayback(patch),
    onMutate: async (patch: Partial<PlaybackSettings>) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_QUERY_KEYS.playback });
      const previous = queryClient.getQueryData<PlaybackSettings>(
        PREFERENCES_QUERY_KEYS.playback
      );

      if (previous) {
        queryClient.setQueryData<PlaybackSettings>(PREFERENCES_QUERY_KEYS.playback, {
          ...previous,
          ...patch,
        });
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PREFERENCES_QUERY_KEYS.playback, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEYS.playback, settings);
    },
  });
}

// ── Notification settings (R-07) ─────────────────────────────────────────────

export function useNotificationSettings() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PREFERENCES_QUERY_KEYS.notifications,
    queryFn: preferencesApi.getNotifications,
    enabled: hasSession,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Partial<NotificationSettings>) =>
      preferencesApi.updateNotifications(patch),
    onMutate: async (patch: Partial<NotificationSettings>) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_QUERY_KEYS.notifications });
      const previous = queryClient.getQueryData<NotificationSettings>(
        PREFERENCES_QUERY_KEYS.notifications
      );

      if (previous) {
        queryClient.setQueryData<NotificationSettings>(PREFERENCES_QUERY_KEYS.notifications, {
          ...previous,
          ...patch,
        });
      }

      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PREFERENCES_QUERY_KEYS.notifications, context.previous);
      }
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(PREFERENCES_QUERY_KEYS.notifications, settings);
    },
  });
}

function devicePlatform(): DevicePlatform {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

/**
 * Registers this device's Expo push token so the server has somewhere to send a
 * new-collection alert. Called when a notification toggle is switched on.
 *
 * Failure is deliberately soft: the preference itself is already saved, and a
 * device without a token simply receives nothing. `expo-notifications` is
 * required lazily because it is unavailable on web and in Expo Go without a
 * project id.
 */
export function useRegisterPushDevice() {
  const registerDevice = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    try {
      // Lazy on purpose: the native module is absent on web and in clients
      // built without it, and a top level import would fail at load.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Notifications = require('expo-notifications');
      const existing = await Notifications.getPermissionsAsync();
      const granted =
        existing.status === 'granted'
          ? true
          : (await Notifications.requestPermissionsAsync()).status === 'granted';

      if (!granted) return false;

      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      const token = tokenResponse?.data;
      if (!token) return false;

      await preferencesApi.registerDevice(token, devicePlatform());
      return true;
    } catch {
      return false;
    }
  }, []);

  return { registerDevice };
}
