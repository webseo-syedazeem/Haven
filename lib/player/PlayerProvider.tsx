import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';

import {
  getTimerConfig,
  PAUSED_TIMER_EXPIRY_MS,
  UNTIL_I_STOP,
  type TimerSelection,
} from '@/constants/timers';
import { useGuestModeActive, useHasSession } from '@/hooks/useSession';
import { usePlaybackSettings } from '@/hooks/usePreferences';
import { homeApi, type Soundscape } from '@/lib/api/home';
import { PLAYBACK_SETTING_DEFAULTS } from '@/lib/api/preferences';
import {
  playerApi,
  PLAY_HISTORY_QUERY_KEY,
  type PlayHistoryRow,
} from '@/lib/api/player';
import {
  getLocalSetting,
  setLocalSetting,
  LOCAL_SETTING_KEYS,
  LOOP_ENABLED_DEFAULT,
} from '@/lib/local-settings';
import { queryClient } from '@/lib/query-client';
import { engine } from './engine';
import { hasLocalSource, toPlayableTrack } from './types';

const PERSIST_DEBOUNCE_MS = 900;
const PERIODIC_PERSIST_MS = 15000;
const FADE_STEP_MS = 250;

const UNAVAILABLE_MESSAGE =
  Platform.OS === 'web'
    ? 'Playback is not available on web yet.'
    : 'Audio needs the Passage dev build — it cannot run in Expo Go.';
const STALLED_MESSAGE = 'Playback stopped unexpectedly. Check your connection and try again.';
const LOCAL_FAILURE_MESSAGE = 'This soundscape could not be played.';
const PLAY_HISTORY_LIMIT = 50;
const GUEST_PLAYER_STATE_STORAGE_KEY = 'passage.guest.player-state.v1';

const LOOP_NOTICE_ENABLED = 'Loop turned on so your timer can finish.';
const LOOP_NOTICE_WILL_STOP = 'Playback will stop when this track ends.';

let optimisticPlaySequence = 0;

/**
 * Makes a confirmed playback visible on Home and Saved immediately, while the
 * POST continues in the background. The server row replaces the temporary one;
 * a failed POST removes only that play without disturbing concurrent plays.
 */
async function recordPlayHistoryOptimistically(
  soundscape: Soundscape,
  positionSeconds: number
) {
  await queryClient.cancelQueries({ queryKey: PLAY_HISTORY_QUERY_KEY }).catch(() => {});

  const optimisticId = [
    'optimistic-play',
    Date.now(),
    optimisticPlaySequence++,
    soundscape.id,
  ].join('-');
  const optimisticRow: PlayHistoryRow = {
    id: optimisticId,
    soundscape_id: soundscape.id,
    played_at: new Date().toISOString(),
    soundscape,
  };

  queryClient.setQueryData<PlayHistoryRow[]>(PLAY_HISTORY_QUERY_KEY, (current) =>
    [optimisticRow, ...(current ?? [])].slice(0, PLAY_HISTORY_LIMIT)
  );

  try {
    const savedRow = await playerApi.addPlayHistory(soundscape.id, positionSeconds);
    queryClient.setQueryData<PlayHistoryRow[]>(PLAY_HISTORY_QUERY_KEY, (current) =>
      (current ?? []).map((row) =>
        row.id === optimisticId
          ? { ...optimisticRow, ...savedRow, soundscape }
          : row
      )
    );
  } catch {
    queryClient.setQueryData<PlayHistoryRow[]>(PLAY_HISTORY_QUERY_KEY, (current) =>
      (current ?? []).filter((row) => row.id !== optimisticId)
    );
  }
}

export type ResumableState = {
  soundscape: Soundscape;
  queue: Soundscape[];
  positionSeconds: number;
  durationSeconds: number | null;
  timerMinutes: number | null;
};

type StoredGuestPlayerState = ResumableState & { savedAt: string };

function isStoredGuestPlayerState(value: unknown): value is StoredGuestPlayerState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredGuestPlayerState>;
  return (
    !!candidate.soundscape &&
    typeof candidate.soundscape === 'object' &&
    typeof candidate.soundscape.id === 'string' &&
    Array.isArray(candidate.queue) &&
    candidate.queue.every((item) => !!item && typeof item.id === 'string') &&
    typeof candidate.positionSeconds === 'number' &&
    Number.isFinite(candidate.positionSeconds) &&
    (candidate.durationSeconds === null ||
      (typeof candidate.durationSeconds === 'number' && Number.isFinite(candidate.durationSeconds))) &&
    (candidate.timerMinutes === null ||
      (typeof candidate.timerMinutes === 'number' && Number.isFinite(candidate.timerMinutes)))
  );
}

export type PlayerStateValue = {
  soundscape: Soundscape | null;
  queue: Soundscape[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  error: string | null;
  /** True when `error` is a playback failure that trying again might fix. */
  canRetry: boolean;
  timerSelection: TimerSelection | null;
  isFadingOut: boolean;
  endToneEnabled: boolean;
  resumable: ResumableState | null;
  /** The "Continuous loop" (repeat-one) preference; persists across launches. */
  loopEnabled: boolean;
  /** A one-shot message for the UI to toast, e.g. when a timer auto-enables loop. */
  loopNotice: { text: string; at: number } | null;
};

export type PlayerProgressValue = {
  position: number;
  duration: number;
  /** Null when no countdown is running (no timer, or "Until I Stop"). */
  timerRemainingSeconds: number | null;
};

export type PlayerActions = {
  playSoundscape: (
    soundscape: Soundscape,
    options?: { queue?: Soundscape[]; startAt?: number }
  ) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seek: (seconds: number) => Promise<void>;
  skipNext: () => Promise<void>;
  skipPrevious: () => Promise<void>;
  setTimer: (selection: TimerSelection | null) => void;
  setEndToneEnabled: (enabled: boolean) => void;
  setLoopEnabled: (enabled: boolean) => void;
  /** `forgetResumable` also drops the Continue card, for a sign out: it belongs to the account. */
  stop: (options?: { forgetResumable?: boolean }) => Promise<void>;
  resume: () => Promise<void>;
};

const INITIAL_STATE: PlayerStateValue = {
  soundscape: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  isBuffering: false,
  hasNext: false,
  hasPrevious: false,
  error: null,
  canRetry: false,
  timerSelection: null,
  isFadingOut: false,
  endToneEnabled: false,
  resumable: null,
  loopEnabled: LOOP_ENABLED_DEFAULT,
  loopNotice: null,
};

const INITIAL_PROGRESS: PlayerProgressValue = {
  position: 0,
  duration: 0,
  timerRemainingSeconds: null,
};

const PlayerStateContext = createContext<PlayerStateValue>(INITIAL_STATE);
const PlayerProgressContext = createContext<PlayerProgressValue>(INITIAL_PROGRESS);
const PlayerActionsContext = createContext<PlayerActions | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const hasSession = useHasSession();
  const guestModeActive = useGuestModeActive();
  const { data: playbackSettings = PLAYBACK_SETTING_DEFAULTS } = usePlaybackSettings();
  const [state, setState] = useState<PlayerStateValue>(INITIAL_STATE);
  const [progress, setProgress] = useState<PlayerProgressValue>(INITIAL_PROGRESS);

  // Refs mirror the pieces of state that callbacks and timers read, so none of
  // the actions need to be re-created when playback advances.
  const soundscapeRef = useRef<Soundscape | null>(null);
  const queueRef = useRef<Soundscape[]>([]);
  const indexRef = useRef(-1);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const timerRef = useRef<{
    selection: TimerSelection | null;
    /** The active deadline while playing; null while off, "Until I Stop", or frozen. */
    endsAt: number | null;
    /** Set while paused: the time left when playback stopped, to recompute a deadline on resume. */
    pausedRemainingMs: number | null;
    /** When the freeze started, so a long pause can expire the timer outright. */
    pausedAt: number | null;
  }>({
    selection: null,
    endsAt: null,
    pausedRemainingMs: null,
    pausedAt: null,
  });
  const endToneRef = useRef(false);
  const loopEnabledRef = useRef(LOOP_ENABLED_DEFAULT);
  /** True only while loop is on because a timer auto-enabled it, never a user choice; session-only. */
  const loopAutoEnabledRef = useRef(false);
  const isPlayingRef = useRef(false);
  const resumableRef = useRef<ResumableState | null>(null);
  const skipNextRef = useRef<PlayerActions['skipNext'] | undefined>(undefined);
  const skipPreviousRef = useRef<PlayerActions['skipPrevious'] | undefined>(undefined);
  const setTimerRef = useRef<PlayerActions['setTimer'] | undefined>(undefined);
  const autoplayNextRef = useRef(PLAYBACK_SETTING_DEFAULTS.autoplay_next);
  const defaultTimerMinutesRef = useRef(PLAYBACK_SETTING_DEFAULTS.default_timer_minutes);
  const fadeEnabledRef = useRef(PLAYBACK_SETTING_DEFAULTS.fade_enabled);
  const persistTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistAt = useRef(0);
  const fadeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSessionRef = useRef(hasSession);
  const guestModeActiveRef = useRef(guestModeActive);

  hasSessionRef.current = hasSession;
  guestModeActiveRef.current = guestModeActive;
  resumableRef.current = state.resumable;

  useEffect(() => {
    autoplayNextRef.current = playbackSettings.autoplay_next;
    defaultTimerMinutesRef.current = playbackSettings.default_timer_minutes;
    fadeEnabledRef.current = playbackSettings.fade_enabled;
    void engine
      .setBackgroundPlayback(playbackSettings.background_playback)
      .catch((error) => console.warn('[player] background playback setting failed', error));
  }, [
    playbackSettings.autoplay_next,
    playbackSettings.background_playback,
    playbackSettings.default_timer_minutes,
    playbackSettings.fade_enabled,
  ]);

  // ---------------------------------------------------------------- persistence

  const persistNow = useCallback(async () => {
    const soundscape = soundscapeRef.current;
    if (!soundscape) return;

    lastPersistAt.current = Date.now();
    const timerSelection = timerRef.current.selection;
    const resumable: ResumableState = {
      soundscape,
      queue: [...queueRef.current],
      positionSeconds: positionRef.current,
      durationSeconds: durationRef.current || soundscape.duration_seconds || null,
      timerMinutes: typeof timerSelection === 'number' ? timerSelection : null,
    };

    try {
      if (hasSessionRef.current) {
        await playerApi.saveState({
          soundscape_id: soundscape.id,
          position_seconds: resumable.positionSeconds,
          duration_seconds: resumable.durationSeconds,
          queue: resumable.queue.map((item) => item.id),
          timer_minutes: resumable.timerMinutes,
        });
      } else if (guestModeActiveRef.current) {
        const stored: StoredGuestPlayerState = {
          ...resumable,
          savedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(GUEST_PLAYER_STATE_STORAGE_KEY, JSON.stringify(stored));
      }
    } catch {
      // Saving player state is best effort; playback must not depend on it.
    }
  }, []);

  const schedulePersist = useCallback(() => {
    if (persistTimeout.current) clearTimeout(persistTimeout.current);
    persistTimeout.current = setTimeout(() => void persistNow(), PERSIST_DEBOUNCE_MS);
  }, [persistNow]);

  /** Keeps the Home "Continue Listening" card in step after a pause or stop. */
  const refreshResumable = useCallback(() => {
    const soundscape = soundscapeRef.current;
    if (!soundscape) return;

    setState((current) => ({
      ...current,
      resumable: {
        soundscape,
        queue: [...queueRef.current],
        positionSeconds: positionRef.current,
        durationSeconds: durationRef.current || soundscape.duration_seconds || null,
        timerMinutes:
          typeof timerRef.current.selection === 'number' ? timerRef.current.selection : null,
      },
    }));
  }, []);

  // ------------------------------------------------------------------- fade out

  const clearFade = useCallback(() => {
    if (fadeInterval.current) {
      clearInterval(fadeInterval.current);
      fadeInterval.current = null;
    }
  }, []);

  useEffect(() => {
    if (playbackSettings.fade_enabled || !fadeInterval.current) return;

    clearFade();
    void engine.setVolume(1);
    setState((current) =>
      current.isFadingOut ? { ...current, isFadingOut: false } : current
    );
  }, [clearFade, playbackSettings.fade_enabled]);

  /** Loop auto-enabled by a timer is session-only: never the user's saved preference. */
  const revertAutoLoop = useCallback(() => {
    if (!loopAutoEnabledRef.current) return;

    loopAutoEnabledRef.current = false;
    loopEnabledRef.current = false;
    engine.setLoopEnabled(false);
    setState((current) => ({ ...current, loopEnabled: false }));
  }, []);

  const clearTimerState = useCallback(() => {
    revertAutoLoop();
    timerRef.current = { selection: null, endsAt: null, pausedRemainingMs: null, pausedAt: null };
    setState((current) => ({ ...current, timerSelection: null, isFadingOut: false }));
    setProgress((current) => ({ ...current, timerRemainingSeconds: null }));
  }, [revertAutoLoop]);

  const finishPlayback = useCallback(async () => {
    clearFade();
    isPlayingRef.current = false;
    // Timer expiry and natural completion update the controls immediately;
    // releasing the native player can finish without holding the UI behind it.
    setState((current) => ({ ...current, isPlaying: false, isFadingOut: false }));
    clearTimerState();
    await engine.stop();
    await engine.setVolume(1);
    refreshResumable();
    void persistNow();
  }, [clearFade, clearTimerState, persistNow, refreshResumable]);

  const handleTimerEnd = useCallback(() => {
    const config = getTimerConfig(soundscapeRef.current?.mode);

    // Modes that offer it play the optional gentle tone after their normal ending.
    if (config.ending.offerEndTone && endToneRef.current) {
      void engine.playEndTone();
    }
    void finishPlayback();
  }, [finishPlayback]);

  const startFadeOut = useCallback(
    (fadeSeconds: number, endsAt: number) => {
      const applyDeadlineVolume = () => {
        const remainingMs = endsAt - Date.now();
        if (remainingMs <= 0) {
          timerRef.current = { ...timerRef.current, endsAt: null };
          handleTimerEnd();
          return false;
        }

        void engine.setVolume(Math.min(1, remainingMs / (fadeSeconds * 1000)));
        return true;
      };

      if (fadeInterval.current) {
        applyDeadlineVolume();
        return;
      }

      setState((current) => ({ ...current, isFadingOut: true }));
      if (!applyDeadlineVolume()) return;

      fadeInterval.current = setInterval(() => {
        applyDeadlineVolume();
      }, FADE_STEP_MS);
    },
    [handleTimerEnd]
  );

  // -------------------------------------------------------- timer pause/resume

  /**
   * Pausing (for any reason — the user, a call, a headset unplugged, the lock
   * screen) freezes an active timer: its deadline/fade are cancelled and the
   * remaining time is banked, so the old deadline can never fire on its own.
   */
  const freezeTimer = useCallback(() => {
    const { endsAt, pausedRemainingMs } = timerRef.current;
    if (pausedRemainingMs !== null || endsAt === null) return;

    clearFade();
    const remainingMs = Math.max(0, endsAt - Date.now());
    timerRef.current = {
      ...timerRef.current,
      endsAt: null,
      pausedRemainingMs: remainingMs,
      pausedAt: Date.now(),
    };
    setState((current) => (current.isFadingOut ? { ...current, isFadingOut: false } : current));
    setProgress((current) => {
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      return current.timerRemainingSeconds === remainingSeconds
        ? current
        : { ...current, timerRemainingSeconds: remainingSeconds };
    });
  }, [clearFade]);

  /**
   * Resuming recomputes the deadline from the banked remaining time and
   * reschedules the fade/stop exactly as the normal flow would. Returns
   * whether a frozen timer was actually resumed.
   */
  const unfreezeTimer = useCallback((): boolean => {
    const { pausedRemainingMs } = timerRef.current;
    if (pausedRemainingMs === null) return false;

    const endsAt = Date.now() + pausedRemainingMs;
    timerRef.current = {
      ...timerRef.current,
      endsAt,
      pausedRemainingMs: null,
      pausedAt: null,
    };
    setProgress((current) => ({
      ...current,
      timerRemainingSeconds: Math.ceil(pausedRemainingMs / 1000),
    }));

    const config = getTimerConfig(soundscapeRef.current?.mode);
    if (
      fadeEnabledRef.current &&
      config.ending.type === 'fade' &&
      pausedRemainingMs <= config.ending.fadeSeconds * 1000
    ) {
      // Already inside the fade window: this starts the fade at the volume
      // that matches what is left, so there is no pop back up to full first.
      startFadeOut(config.ending.fadeSeconds, endsAt);
    } else {
      void engine.setVolume(1);
    }
    return true;
  }, [startFadeOut]);

  const reconcileTimer = useCallback(() => {
    const { endsAt, pausedRemainingMs, pausedAt } = timerRef.current;

    if (pausedRemainingMs !== null) {
      // Frozen: nothing to count down. A pause this long drops the timer
      // outright rather than let it resume for a track that has moved on.
      if (pausedAt !== null && Date.now() - pausedAt >= PAUSED_TIMER_EXPIRY_MS) {
        clearTimerState();
      }
      return;
    }

    if (!endsAt) return;

    const remainingMs = endsAt - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    setProgress((current) =>
      current.timerRemainingSeconds === remainingSeconds
        ? current
        : { ...current, timerRemainingSeconds: remainingSeconds }
    );

    if (remainingMs <= 0) {
      timerRef.current = { ...timerRef.current, endsAt: null };
      handleTimerEnd();
      return;
    }

    const config = getTimerConfig(soundscapeRef.current?.mode);
    if (
          fadeEnabledRef.current &&
          config.ending.type === 'fade' &&
      remainingMs <= config.ending.fadeSeconds * 1000
    ) {
      startFadeOut(config.ending.fadeSeconds, endsAt);
    }
  }, [clearTimerState, handleTimerEnd, startFadeOut]);

  // ---------------------------------------------------------------- engine wiring

  useEffect(() => {
    const unsubscribe = engine.subscribe({
      onPlaybackChange: ({ isPlaying, isBuffering }) => {
        const wasPlaying = isPlayingRef.current;
        isPlayingRef.current = isPlaying;
        // Covers every pause/resume source, not just the in-app toggle: the
        // lock screen, a call interruption, a headset unplugged. An action
        // that already updated the ref itself (toggling, a failure) makes
        // this a no-op, since `wasPlaying` already matches.
        if (isPlaying && !wasPlaying) {
          unfreezeTimer();
        } else if (!isPlaying && wasPlaying) {
          freezeTimer();
        }
        setState((current) => {
          // Sound is flowing again, so an earlier failure message no longer applies.
          const clearError = isPlaying && current.canRetry;
          if (
            current.isPlaying === isPlaying &&
            current.isBuffering === isBuffering &&
            !clearError
          ) {
            return current;
          }
          return {
            ...current,
            isPlaying,
            isBuffering,
            ...(clearError ? { error: null, canRetry: false } : null),
          };
        });
      },
      onProgress: ({ position, duration, trackId }) => {
        // An event already in flight when a newer track was loaded still
        // carries the track it was captured for; one that does not match the
        // track now playing can never be applied, however it was captured —
        // a stale status update, a recovery reload, a queued seek.
        if (trackId !== null && trackId !== soundscapeRef.current?.id) return;

        positionRef.current = position;
        if (duration > 0) durationRef.current = duration;

        setProgress((current) => ({
          ...current,
          position,
          duration: duration > 0 ? duration : current.duration,
        }));

        if (
          soundscapeRef.current &&
          Date.now() - lastPersistAt.current > PERIODIC_PERSIST_MS &&
          position > 0
        ) {
          void persistNow();
        }
      },
      onTrackEnd: () => {
        if (
          autoplayNextRef.current &&
          indexRef.current >= 0 &&
          indexRef.current < queueRef.current.length - 1
        ) {
          void skipNextRef.current?.();
          return;
        }
        void finishPlayback();
      },
      onPlaybackFailed: () => {
        // The engine's own reloads could not revive the source and it has released
        // the player, so the next play loads afresh from the position it reported.
        isPlayingRef.current = false;
        freezeTimer();
        const soundscape = soundscapeRef.current;
        setState((current) => ({
          ...current,
          isPlaying: false,
          isBuffering: false,
          error:
            soundscape && hasLocalSource(soundscape.id) ? LOCAL_FAILURE_MESSAGE : STALLED_MESSAGE,
          canRetry: true,
        }));
        refreshResumable();
        void persistNow();
      },
      onRemoteNext: () => void skipNextRef.current?.(),
      onRemotePrevious: () => void skipPreviousRef.current?.(),
    });

    void engine.setup();

    return () => {
      unsubscribe();
      // `createAudioPlayer` is not hook-managed, so the provider owns release.
      // Android task removal is handled by app config because the OS cannot be
      // expected to run this JS cleanup after a swipe-close.
      void engine.reset();
    };
  }, [finishPlayback, freezeTimer, persistNow, refreshResumable, unfreezeTimer]);

  // The loop preference is read once per app launch; missing or unreadable
  // storage keeps the safe default of off.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const saved = await getLocalSetting(LOCAL_SETTING_KEYS.loopEnabled, LOOP_ENABLED_DEFAULT);
      if (cancelled) return;

      loopEnabledRef.current = saved;
      engine.setLoopEnabled(saved);
      setState((current) => ({ ...current, loopEnabled: saved }));
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Countdown tick for an active timer.
  useEffect(() => {
    if (!state.timerSelection || state.timerSelection === UNTIL_I_STOP) return;

    reconcileTimer();
    const interval = setInterval(reconcileTimer, 1000);

    return () => clearInterval(interval);
  }, [reconcileTimer, state.timerSelection]);

  // Save on the way to the background, where a debounce may never fire.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        reconcileTimer();
      } else if (soundscapeRef.current) {
        void persistNow();
      }
    });

    return () => subscription.remove();
  }, [persistNow, reconcileTimer]);

  // Anything saved by a previous account or guest session becomes the resume offer on Home.
  useEffect(() => {
    if (!hasSession && !guestModeActive) return;
    let cancelled = false;

    void (async () => {
      try {
        if (guestModeActive && !hasSession) {
          const raw = await AsyncStorage.getItem(GUEST_PLAYER_STATE_STORAGE_KEY);
          if (!raw || cancelled) return;

          const saved: unknown = JSON.parse(raw);
          if (!isStoredGuestPlayerState(saved)) {
            await AsyncStorage.removeItem(GUEST_PLAYER_STATE_STORAGE_KEY);
            return;
          }

          const queue = saved.queue.some((item) => item.id === saved.soundscape.id)
            ? saved.queue
            : [saved.soundscape, ...saved.queue];
          setState((current) =>
            current.soundscape ? current : { ...current, resumable: { ...saved, queue } }
          );
          return;
        }

        const saved = await playerApi.getState();
        if (!saved?.soundscape_id || cancelled) return;

        const soundscape = await homeApi.soundscape(saved.soundscape_id);
        if (!soundscape || cancelled) return;

        // The existing player-state payload stores IDs; recover their order and
        // tolerate collections that have lost an unavailable/deleted track.
        const queueIds = [...new Set(saved.queue ?? [])];
        const restored = await Promise.all(
          queueIds.map((id) =>
            id === soundscape.id
              ? Promise.resolve(soundscape)
              : homeApi.soundscape(id).catch(() => null)
          )
        );
        if (cancelled) return;
        const queue = restored.filter((item): item is Soundscape => item !== null);
        if (!queue.some((item) => item.id === soundscape.id)) queue.unshift(soundscape);

        setState((current) =>
          current.soundscape
            ? current
            : {
                ...current,
                resumable: {
                  soundscape,
                  queue,
                  positionSeconds: saved.position_seconds ?? 0,
                  durationSeconds: saved.duration_seconds ?? null,
                  timerMinutes: saved.timer_minutes ?? null,
                },
              }
        );
      } catch {
        // No saved state, or it is unreachable — Home falls back to the API rail.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [guestModeActive, hasSession]);

  useEffect(
    () => () => {
      if (persistTimeout.current) clearTimeout(persistTimeout.current);
      if (fadeInterval.current) clearInterval(fadeInterval.current);
    },
    []
  );

  // ---------------------------------------------------------------------- actions

  const loadAndPlay = useCallback(
    async (soundscape: Soundscape, queue: Soundscape[], index: number, startAt: number) => {
      const track = toPlayableTrack(soundscape);

      soundscapeRef.current = soundscape;
      queueRef.current = queue;
      indexRef.current = index;
      positionRef.current = startAt;
      durationRef.current = soundscape.duration_seconds ?? 0;

      setState((current) => ({
        ...current,
        soundscape,
        queue,
        queueIndex: index,
        hasNext: index >= 0 && index < queue.length - 1,
        hasPrevious: index > 0,
        isBuffering: true,
        error: track ? null : 'This soundscape has no audio file yet.',
        canRetry: false,
        resumable: null,
      }));
      setProgress({
        position: startAt,
        duration: soundscape.duration_seconds ?? 0,
        timerRemainingSeconds:
          timerRef.current.pausedRemainingMs !== null
            ? Math.ceil(timerRef.current.pausedRemainingMs / 1000)
            : timerRef.current.endsAt
              ? Math.max(0, Math.ceil((timerRef.current.endsAt - Date.now()) / 1000))
              : null,
      });

      if (!track) {
        setState((current) => ({ ...current, isBuffering: false, isPlaying: false }));
        return false;
      }

      const available = await engine.setup();
      if (!available) {
        setState((current) => ({
          ...current,
          isBuffering: false,
          isPlaying: false,
          error: UNAVAILABLE_MESSAGE,
        }));
        return false;
      }

      try {
        // A queue change must not cancel an active sleep-timer fade or restart
        // its deadline. The fade interval keeps controlling the same engine.
        if (!fadeInterval.current) await engine.setVolume(1);
        await engine.load(track, startAt);
        await engine.play();
      } catch (error) {
        console.warn('[player] playback failed', error);
        setState((current) => ({
          ...current,
          isBuffering: false,
          isPlaying: false,
          // A local file that will not open is a real fault; a stream that will
          // not open is usually just a missing connection, and saying so tells
          // the user what to do about it.
          error: hasLocalSource(soundscape.id)
            ? LOCAL_FAILURE_MESSAGE
            : 'This one needs a connection. Try again once you are back online.',
          canRetry: true,
        }));
        return false;
      }

      // A play is recorded when audio actually starts, not on navigation.
      if (hasSessionRef.current) {
        void recordPlayHistoryOptimistically(soundscape, startAt);
      }
      schedulePersist();
      return true;
    },
    [schedulePersist]
  );

  /** A different soundscape/queue cancels the timer; it belongs to the session, not a single tap. */
  const cancelTimerForNewStart = useCallback(() => {
    if (timerRef.current.selection === null) return;

    clearFade();
    void engine.setVolume(1);
    clearTimerState();
  }, [clearFade, clearTimerState]);

  const playSoundscape = useCallback<PlayerActions['playSoundscape']>(
    async (soundscape, options = {}) => {
      // Snapshot the displayed list so later filtering/reordering cannot move
      // the active index. History may contain the same soundscape more than once.
      const queue = [...new Map((options.queue ?? []).map((item) => [item.id, item])).values()];
      let index = queue.findIndex((item) => item.id === soundscape.id);
      if (index < 0) {
        queue.unshift(soundscape);
        index = 0;
      } else {
        queue[index] = soundscape;
      }

      // Re-tapping the same soundscape in the same queue (or toggling play/pause
      // on it) must not cancel the timer — only a genuinely different track or
      // queue, which starting a new listening session, does.
      const isSameSession =
        soundscapeRef.current?.id === soundscape.id &&
        queueRef.current.length === queue.length &&
        queueRef.current.every((item, i) => item.id === queue[i].id);
      if (!isSameSession) cancelTimerForNewStart();

      const didStart = await loadAndPlay(
        soundscape,
        queue,
        index,
        Math.max(0, options.startAt ?? 0)
      );
      if (didStart && !isSameSession && defaultTimerMinutesRef.current !== null) {
        setTimerRef.current?.(defaultTimerMinutesRef.current);
      }
    },
    [cancelTimerForNewStart, loadAndPlay]
  );

  const togglePlayPause = useCallback(async () => {
    const soundscape = soundscapeRef.current;
    if (!soundscape) return;

    if (isPlayingRef.current) {
      // Freezes an active timer (remaining = deadline - now) and cancels any
      // scheduled fade/stop; resuming reschedules from the banked remainder.
      freezeTimer();
      isPlayingRef.current = false;
      // Optimistic UI: swap Pause to Play before the native command resolves.
      setState((current) => ({ ...current, isPlaying: false, isFadingOut: false }));
      try {
        await engine.pause();
      } catch (error) {
        // A rejected pause means audio may still be flowing, so restore both
        // the icon and any timer that was frozen for the attempted pause.
        isPlayingRef.current = true;
        unfreezeTimer();
        setState((current) => ({ ...current, isPlaying: true }));
        console.warn('[player] pause failed', error);
        return;
      }
      refreshResumable();
      void persistNow();
      return;
    }

    if (!engine.hasSource()) {
      const track = toPlayableTrack(soundscape);
      if (!track || !(await engine.setup())) return;
      await engine.load(track, positionRef.current);
    }

    const timerResumed = unfreezeTimer();
    isPlayingRef.current = true;
    // Optimistic UI: show Pause at once while the native player resumes.
    setState((current) => ({
      ...current,
      isPlaying: true,
      ...(current.canRetry ? { error: null, canRetry: false } : null),
    }));
    try {
      if (!timerResumed) await engine.setVolume(1);
      await engine.play();
    } catch (error) {
      freezeTimer();
      isPlayingRef.current = false;
      setState((current) => ({
        ...current,
        isPlaying: false,
        isBuffering: false,
        error: 'Unable to start playback. Try again.',
        canRetry: true,
      }));
      console.warn('[player] play failed', error);
      return;
    }
    schedulePersist();
  }, [freezeTimer, persistNow, refreshResumable, schedulePersist, unfreezeTimer]);

  const seek = useCallback(
    async (seconds: number) => {
      if (!soundscapeRef.current) return;

      const clamped = Math.max(0, Math.min(seconds, durationRef.current || seconds));
      positionRef.current = clamped;
      // Shown at once so the scrubber does not snap back. The engine confirms the
      // seek from real playback, and reloads at this position if it never resumes.
      setProgress((current) => ({ ...current, position: clamped }));
      try {
        await engine.seekTo(clamped);
      } catch (error) {
        console.warn('[player] seek failed', error);
      }
      schedulePersist();
    },
    [schedulePersist]
  );

  const skipNext = useCallback(async () => {
    const queue = queueRef.current;
    const next = indexRef.current + 1;
    if (next <= 0 || next >= queue.length) return;

    await loadAndPlay(queue[next], queue, next, 0);
  }, [loadAndPlay]);

  const skipPrevious = useCallback(async () => {
    const queue = queueRef.current;
    const previous = indexRef.current - 1;
    if (previous < 0 || previous >= queue.length) return;

    await loadAndPlay(queue[previous], queue, previous, 0);
  }, [loadAndPlay]);

  skipNextRef.current = skipNext;
  skipPreviousRef.current = skipPrevious;

  const setTimer = useCallback<PlayerActions['setTimer']>(
    (selection) => {
      clearFade();
      void engine.setVolume(1);

      if (selection === null) {
        clearTimerState();
        schedulePersist();
        return;
      }

      const timerDurationMs = selection === UNTIL_I_STOP ? null : selection * 60_000;
      const startsNow = timerDurationMs !== null && isPlayingRef.current;
      const endsAt = startsNow ? Date.now() + timerDurationMs : null;
      const pausedRemainingMs = timerDurationMs !== null && !startsNow ? timerDurationMs : null;
      timerRef.current = {
        selection,
        endsAt,
        pausedRemainingMs,
        pausedAt: pausedRemainingMs !== null ? Date.now() : null,
      };

      // A timer that outlasts the current track would otherwise end playback
      // early. Only a loopable track can be kept going, and only while the
      // listener has not already chosen to loop. This auto-enable is
      // session-only: it is never written to the saved preference, and it
      // reverts on its own once the timer is cancelled or ends.
      let notice: PlayerStateValue['loopNotice'] = null;
      if (!loopEnabledRef.current && soundscapeRef.current?.is_loop) {
        const remainingMs = Math.max(0, durationRef.current - positionRef.current) * 1000;
        const timerMs = timerDurationMs ?? Infinity;
        if (timerMs > remainingMs) {
          loopEnabledRef.current = true;
          loopAutoEnabledRef.current = true;
          engine.setLoopEnabled(true);
          notice = { text: LOOP_NOTICE_ENABLED, at: Date.now() };
        }
      }

      setState((current) => ({
        ...current,
        timerSelection: selection,
        isFadingOut: false,
        loopEnabled: loopEnabledRef.current,
        loopNotice: notice ?? current.loopNotice,
      }));
      setProgress((current) => ({
        ...current,
        timerRemainingSeconds:
          timerDurationMs === null ? null : Math.ceil(timerDurationMs / 1000),
      }));
      schedulePersist();
    },
    [clearFade, clearTimerState, schedulePersist]
  );

  setTimerRef.current = setTimer;

  const setEndToneEnabled = useCallback((enabled: boolean) => {
    endToneRef.current = enabled;
    setState((current) => ({ ...current, endToneEnabled: enabled }));
  }, []);

  const setLoopEnabled = useCallback((enabled: boolean) => {
    // An explicit choice, even to turn it back off, is a real preference from
    // here on — no longer subject to being auto-reverted with the timer.
    loopAutoEnabledRef.current = false;
    loopEnabledRef.current = enabled;
    engine.setLoopEnabled(enabled);
    void setLocalSetting(LOCAL_SETTING_KEYS.loopEnabled, enabled);

    // Turning loop off is allowed even with a timer still running longer than
    // the track has left; this hints that playback will end before the timer does.
    let notice: PlayerStateValue['loopNotice'] = null;
    if (!enabled && timerRef.current.selection !== null) {
      const remainingMs = Math.max(0, durationRef.current - positionRef.current) * 1000;
      const endsAt = timerRef.current.endsAt;
      const timerMs = endsAt ? endsAt - Date.now() : Infinity;
      if (timerMs > remainingMs) {
        notice = { text: LOOP_NOTICE_WILL_STOP, at: Date.now() };
      }
    }

    setState((current) => ({ ...current, loopEnabled: enabled, loopNotice: notice }));
  }, []);

  const stop = useCallback(async (options?: { forgetResumable?: boolean }) => {
    const forgetResumable = options?.forgetResumable === true;
    clearFade();
    isPlayingRef.current = false;
    await persistNow();
    if (!forgetResumable) refreshResumable();
    if (forgetResumable && guestModeActiveRef.current) {
      await AsyncStorage.removeItem(GUEST_PLAYER_STATE_STORAGE_KEY).catch(() => {});
    }
    await engine.reset();
    await engine.setVolume(1);
    revertAutoLoop();

    soundscapeRef.current = null;
    queueRef.current = [];
    indexRef.current = -1;
    positionRef.current = 0;
    durationRef.current = 0;
    timerRef.current = { selection: null, endsAt: null, pausedRemainingMs: null, pausedAt: null };

    setState((current) => ({
      ...INITIAL_STATE,
      resumable: forgetResumable ? null : current.resumable,
      endToneEnabled: current.endToneEnabled,
      loopEnabled: loopEnabledRef.current,
    }));
    setProgress(INITIAL_PROGRESS);
  }, [clearFade, persistNow, refreshResumable, revertAutoLoop]);

  const resume = useCallback(async () => {
    const resumable = resumableRef.current;
    if (!resumable) return;

    await playSoundscape(resumable.soundscape, {
      queue: [resumable.soundscape],
      startAt: resumable.positionSeconds,
    });
    if (typeof resumable.timerMinutes === 'number' && resumable.timerMinutes > 0) {
      setTimer(resumable.timerMinutes);
    }
  }, [playSoundscape, setTimer]);

  const actions = useMemo<PlayerActions>(
    () => ({
      playSoundscape,
      togglePlayPause,
      seek,
      skipNext,
      skipPrevious,
      setTimer,
      setEndToneEnabled,
      setLoopEnabled,
      stop,
      resume,
    }),
    [
      playSoundscape,
      togglePlayPause,
      seek,
      skipNext,
      skipPrevious,
      setTimer,
      setEndToneEnabled,
      setLoopEnabled,
      stop,
      resume,
    ]
  );

  return (
    <PlayerActionsContext.Provider value={actions}>
      <PlayerStateContext.Provider value={state}>
        <PlayerProgressContext.Provider value={progress}>{children}</PlayerProgressContext.Provider>
      </PlayerStateContext.Provider>
    </PlayerActionsContext.Provider>
  );
}

/** Actions only — safe for screens that must not re-render as playback ticks. */
export function usePlayerActions() {
  const actions = useContext(PlayerActionsContext);
  if (!actions) {
    throw new Error('usePlayerActions must be used inside <PlayerProvider>');
  }
  return actions;
}

export function usePlayerState() {
  return useContext(PlayerStateContext);
}

export function usePlayerProgress() {
  return useContext(PlayerProgressContext);
}

/** Everything at once, for the mini player and the full screen player. */
export function usePlayer() {
  const actions = usePlayerActions();
  const state = usePlayerState();
  const progress = usePlayerProgress();

  return { ...state, ...progress, ...actions };
}
