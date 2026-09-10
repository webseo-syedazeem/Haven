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
import { AppState, Platform } from 'react-native';

import { getTimerConfig, UNTIL_I_STOP, type TimerSelection } from '@/constants/timers';
import { useHasSession } from '@/hooks/useSession';
import { homeApi, type Soundscape } from '@/lib/api/home';
import { playerApi } from '@/lib/api/player';
import { engine } from './engine';
import { hasLocalSource, toPlayableTrack } from './types';

const PERSIST_DEBOUNCE_MS = 900;
const PERIODIC_PERSIST_MS = 15000;
const FADE_STEP_MS = 250;

const UNAVAILABLE_MESSAGE =
  Platform.OS === 'web'
    ? 'Playback is not available on web yet.'
    : 'Audio needs the Passage dev build — it cannot run in Expo Go.';

export type ResumableState = {
  soundscape: Soundscape;
  queue: Soundscape[];
  positionSeconds: number;
  durationSeconds: number | null;
  timerMinutes: number | null;
};

export type PlayerStateValue = {
  soundscape: Soundscape | null;
  queue: Soundscape[];
  queueIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
  error: string | null;
  timerSelection: TimerSelection | null;
  isFadingOut: boolean;
  endToneEnabled: boolean;
  resumable: ResumableState | null;
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
  stop: () => Promise<void>;
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
  timerSelection: null,
  isFadingOut: false,
  endToneEnabled: false,
  resumable: null,
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
  const [state, setState] = useState<PlayerStateValue>(INITIAL_STATE);
  const [progress, setProgress] = useState<PlayerProgressValue>(INITIAL_PROGRESS);

  // Refs mirror the pieces of state that callbacks and timers read, so none of
  // the actions need to be re-created when playback advances.
  const soundscapeRef = useRef<Soundscape | null>(null);
  const queueRef = useRef<Soundscape[]>([]);
  const indexRef = useRef(-1);
  const positionRef = useRef(0);
  const durationRef = useRef(0);
  const timerRef = useRef<{ selection: TimerSelection | null; endsAt: number | null }>({
    selection: null,
    endsAt: null,
  });
  const endToneRef = useRef(false);
  const isPlayingRef = useRef(false);
  const resumableRef = useRef<ResumableState | null>(null);
  const skipNextRef = useRef<PlayerActions['skipNext'] | undefined>(undefined);
  const skipPreviousRef = useRef<PlayerActions['skipPrevious'] | undefined>(undefined);
  const persistTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPersistAt = useRef(0);
  const fadeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasSessionRef = useRef(hasSession);

  hasSessionRef.current = hasSession;
  resumableRef.current = state.resumable;

  // ---------------------------------------------------------------- persistence

  const persistNow = useCallback(async () => {
    const soundscape = soundscapeRef.current;
    if (!soundscape || !hasSessionRef.current) return;

    lastPersistAt.current = Date.now();
    const timerSelection = timerRef.current.selection;

    try {
      await playerApi.saveState({
        soundscape_id: soundscape.id,
        position_seconds: positionRef.current,
        duration_seconds: durationRef.current || soundscape.duration_seconds || null,
        queue: queueRef.current.map((item) => item.id),
        timer_minutes: typeof timerSelection === 'number' ? timerSelection : null,
      });
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

  const clearTimerState = useCallback(() => {
    timerRef.current = { selection: null, endsAt: null };
    setState((current) => ({ ...current, timerSelection: null, isFadingOut: false }));
    setProgress((current) => ({ ...current, timerRemainingSeconds: null }));
  }, []);

  const finishPlayback = useCallback(async () => {
    clearFade();
    isPlayingRef.current = false;
    await engine.stop();
    await engine.setVolume(1);
    setState((current) => ({ ...current, isPlaying: false, isFadingOut: false }));
    clearTimerState();
    refreshResumable();
    void persistNow();
  }, [clearFade, clearTimerState, persistNow, refreshResumable]);

  const startFadeOut = useCallback(
    (fadeSeconds: number) => {
      clearFade();
      setState((current) => ({ ...current, isFadingOut: true }));

      const startedAt = Date.now();
      fadeInterval.current = setInterval(() => {
        const elapsed = (Date.now() - startedAt) / 1000;
        const level = 1 - elapsed / fadeSeconds;

        if (level <= 0) {
          void finishPlayback();
          return;
        }

        void engine.setVolume(level);
      }, FADE_STEP_MS);
    },
    [clearFade, finishPlayback]
  );

  const handleTimerEnd = useCallback(() => {
    const config = getTimerConfig(soundscapeRef.current?.mode);

    if (config.ending.type === 'fade') {
      startFadeOut(config.ending.fadeSeconds);
      return;
    }

    // Focus: a silent stop unless the listener asked for the gentle end tone.
    if (endToneRef.current) {
      void engine.playEndTone();
    }
    void finishPlayback();
  }, [finishPlayback, startFadeOut]);

  // ---------------------------------------------------------------- engine wiring

  useEffect(() => {
    const unsubscribe = engine.subscribe({
      onPlaybackChange: ({ isPlaying, isBuffering }) => {
        isPlayingRef.current = isPlaying;
        setState((current) =>
          current.isPlaying === isPlaying && current.isBuffering === isBuffering
            ? current
            : { ...current, isPlaying, isBuffering }
        );
      },
      onProgress: ({ position, duration }) => {
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
        if (indexRef.current >= 0 && indexRef.current < queueRef.current.length - 1) {
          void skipNextRef.current?.();
          return;
        }
        void finishPlayback();
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
  }, [finishPlayback, persistNow]);

  // Countdown tick for an active timer.
  useEffect(() => {
    if (!state.timerSelection || state.timerSelection === UNTIL_I_STOP) return;

    const interval = setInterval(() => {
      const endsAt = timerRef.current.endsAt;
      if (!endsAt) return;

      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setProgress((current) =>
        current.timerRemainingSeconds === remaining
          ? current
          : { ...current, timerRemainingSeconds: remaining }
      );

      if (remaining <= 0) {
        timerRef.current = { ...timerRef.current, endsAt: null };
        handleTimerEnd();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [handleTimerEnd, state.timerSelection]);

  // Save on the way to the background, where a debounce may never fire.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status !== 'active' && soundscapeRef.current) {
        void persistNow();
      }
    });

    return () => subscription.remove();
  }, [persistNow]);

  // Anything saved by a previous session becomes the resume offer on Home.
  useEffect(() => {
    if (!hasSession) return;
    let cancelled = false;

    void (async () => {
      try {
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
  }, [hasSession]);

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
        resumable: null,
      }));
      setProgress({
        position: startAt,
        duration: soundscape.duration_seconds ?? 0,
        timerRemainingSeconds: timerRef.current.endsAt
          ? Math.max(0, Math.round((timerRef.current.endsAt - Date.now()) / 1000))
          : null,
      });

      if (!track) {
        setState((current) => ({ ...current, isBuffering: false, isPlaying: false }));
        return;
      }

      const available = await engine.setup();
      if (!available) {
        setState((current) => ({
          ...current,
          isBuffering: false,
          isPlaying: false,
          error: UNAVAILABLE_MESSAGE,
        }));
        return;
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
            ? 'This soundscape could not be played.'
            : 'This one needs a connection. Download it to play offline.',
        }));
        return;
      }

      // A play is recorded when audio actually starts, not on navigation.
      if (hasSessionRef.current) {
        void playerApi.addPlayHistory(soundscape.id, startAt).catch(() => {});
      }
      schedulePersist();
    },
    [schedulePersist]
  );

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

      await loadAndPlay(soundscape, queue, index, Math.max(0, options.startAt ?? 0));
    },
    [loadAndPlay]
  );

  const togglePlayPause = useCallback(async () => {
    const soundscape = soundscapeRef.current;
    if (!soundscape) return;

    if (isPlayingRef.current) {
      clearFade();
      isPlayingRef.current = false;
      await engine.pause();
      setState((current) => ({ ...current, isPlaying: false, isFadingOut: false }));
      refreshResumable();
      void persistNow();
      return;
    }

    if (!engine.hasSource()) {
      const track = toPlayableTrack(soundscape);
      if (!track || !(await engine.setup())) return;
      await engine.load(track, positionRef.current);
    }

    await engine.setVolume(1);
    isPlayingRef.current = true;
    await engine.play();
    setState((current) => ({ ...current, isPlaying: true }));
    schedulePersist();
  }, [clearFade, persistNow, refreshResumable, schedulePersist]);

  const seek = useCallback(
    async (seconds: number) => {
      if (!soundscapeRef.current) return;

      const clamped = Math.max(0, Math.min(seconds, durationRef.current || seconds));
      positionRef.current = clamped;
      setProgress((current) => ({ ...current, position: clamped }));
      await engine.seekTo(clamped);
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

      const endsAt = selection === UNTIL_I_STOP ? null : Date.now() + selection * 60_000;
      timerRef.current = { selection, endsAt };

      setState((current) => ({ ...current, timerSelection: selection, isFadingOut: false }));
      setProgress((current) => ({
        ...current,
        timerRemainingSeconds: endsAt ? Math.round((endsAt - Date.now()) / 1000) : null,
      }));
      schedulePersist();
    },
    [clearFade, clearTimerState, schedulePersist]
  );

  const setEndToneEnabled = useCallback((enabled: boolean) => {
    endToneRef.current = enabled;
    setState((current) => ({ ...current, endToneEnabled: enabled }));
  }, []);

  const stop = useCallback(async () => {
    clearFade();
    await persistNow();
    refreshResumable();
    await engine.reset();
    await engine.setVolume(1);

    soundscapeRef.current = null;
    queueRef.current = [];
    indexRef.current = -1;
    positionRef.current = 0;
    durationRef.current = 0;
    timerRef.current = { selection: null, endsAt: null };

    setState((current) => ({
      ...INITIAL_STATE,
      resumable: current.resumable,
      endToneEnabled: current.endToneEnabled,
    }));
    setProgress(INITIAL_PROGRESS);
  }, [clearFade, persistNow, refreshResumable]);

  const resume = useCallback(async () => {
    const resumable = resumableRef.current;
    if (!resumable) return;

    await playSoundscape(resumable.soundscape, {
      queue: resumable.queue,
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
