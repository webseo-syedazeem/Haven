import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import type { Soundscape } from '@/lib/api/home';
import { createPlayerEngine } from './engine';
import { toPreviewTrack, type PlayerEngine } from './types';

const UNAVAILABLE_MESSAGE = 'Preview playback is not available on this device.';
const FAILED_MESSAGE = 'That preview could not be played. Please try again.';

export type ScopedPlayerState = {
  activeId: string | null;
  /** Mirrors the native player: the tap that starts playback, and any pause from outside the app. */
  isPlaying: boolean;
  /** True from the tap until audio starts, including automatic recovery attempts. */
  isBuffering: boolean;
  isRecovering: boolean;
  isPlaybackPending: boolean;
  position: number;
  duration: number;
  error: string | null;
};

const IDLE: ScopedPlayerState = {
  activeId: null,
  isPlaying: false,
  isBuffering: false,
  isRecovering: false,
  isPlaybackPending: false,
  position: 0,
  duration: 0,
  error: null,
};

/**
 * Plays one soundscape at a time on a private engine, for a screen that shows
 * a short preview before the app-wide player exists. It never touches
 * `PlayerProvider`, so no queue, mini player or resume state is created.
 *
 * The engine publishes the track to the OS lock screen and notification with
 * the same metadata the main player uses. The play and pause buttons there act
 * on the native player directly, so the hook listens for the resulting status
 * change to keep its own state true.
 *
 * Everything is torn down, controls included, when the screen loses focus, not
 * only on unmount (a screen that something is pushed over stays mounted
 * underneath it). Merely putting the app in the background keeps the preview
 * alive, matching the full player. Android task removal is handled by the
 * app's `stopWithTask` audio-service configuration.
 */
export function useScopedPlayer() {
  const engineRef = useRef<PlayerEngine | null>(null);
  // `ownsLockScreen: false` because the app-wide player uses the same single
  // lock-screen slot; this engine may only ever clear its own controls.
  engineRef.current ??= createPlayerEngine({
    lockScreen: true,
    ownsLockScreen: false,
    releaseAudioSession: false,
  });

  const requestRef = useRef(0);
  const activeIdRef = useRef<string | null>(null);
  const playingRef = useRef(false);
  const recoveringRef = useRef(false);
  const pendingPositionRef = useRef(0);
  const positionRef = useRef(0);
  /** Set once the current track has actually reported playing, so start-up states are not read as a pause. */
  const startedRef = useRef(false);
  const [state, setState] = useState<ScopedPlayerState>(IDLE);

  const reset = useCallback((error: string | null = null) => {
    requestRef.current += 1;
    activeIdRef.current = null;
    playingRef.current = false;
    recoveringRef.current = false;
    positionRef.current = 0;
    startedRef.current = false;
    setState({ ...IDLE, error });
  }, []);

  /** Stops playback and clears the lock-screen controls; the next tap starts afresh. */
  const stop = useCallback(() => {
    reset();
    void engineRef.current?.reset();
  }, [reset]);

  const pauseActive = useCallback(() => {
    if (!playingRef.current) return;

    playingRef.current = false;
    setState((current) => ({
      ...current,
      isPlaying: false,
      isBuffering: false,
      isRecovering: false,
      isPlaybackPending: false,
    }));
    void engineRef.current?.pause();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const engine = engineRef.current;
      if (!engine) return undefined;

      const unsubscribe = engine.subscribe({
        onPlaybackChange: ({ isPlaying, isBuffering }) => {
          if (activeIdRef.current === null) return;

          if (isPlaying) {
            startedRef.current = true;
            playingRef.current = true;
            setState((current) => ({ ...current, isPlaying: true, isBuffering: false }));
            return;
          }

          if (isBuffering) {
            setState((current) => ({ ...current, isPlaying: false, isBuffering: true }));
            return;
          }

          if (recoveringRef.current) {
            setState((current) => ({ ...current, isPlaying: false, isBuffering: false }));
            return;
          }

          // Paused from the lock screen or notification, a headset button, or an
          // interruption such as a call.
          if (!isBuffering && startedRef.current && playingRef.current) {
            playingRef.current = false;
            setState((current) => ({ ...current, isPlaying: false, isBuffering: false }));
          }
        },
        onRecoveryStateChange: ({ isRecovering }) => {
          recoveringRef.current = isRecovering;
          if (activeIdRef.current !== null) {
            if (isRecovering) pendingPositionRef.current = positionRef.current;
            setState((current) => ({
              ...current,
              isRecovering,
              ...(isRecovering ? { isPlaybackPending: true } : null),
            }));
          }
        },
        onProgress: ({ position, duration }) => {
          if (activeIdRef.current === null) return;
          positionRef.current = position;

          setState((current) => ({
            ...current,
            isPlaybackPending:
              current.isPlaybackPending &&
              playingRef.current &&
              Math.abs(position - pendingPositionRef.current) > 0.05
                ? false
                : current.isPlaybackPending,
            position,
            duration: duration > 0 ? duration : current.duration,
          }));
        },
        onTrackEnd: () => {
          playingRef.current = false;
          setState((current) => ({
            ...current,
            isPlaying: false,
            isBuffering: false,
            isRecovering: false,
            isPlaybackPending: false,
            position: 0,
          }));
          void engine.seekTo(0);
        },
        onPlaybackFailed: () => {
          if (activeIdRef.current === null) return;
          // The engine gave up after its own reloads and released the player, so
          // the next tap starts the preview afresh.
          reset(FAILED_MESSAGE);
        },
      });

      return () => {
        unsubscribe();
        stop();
      };
    }, [reset, stop])
  );

  const toggle = useCallback(
    async (soundscape: Soundscape) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (activeIdRef.current === soundscape.id) {
        if (playingRef.current) {
          pauseActive();
          return;
        }

        playingRef.current = true;
        pendingPositionRef.current = positionRef.current;
        setState((current) => ({
          ...current,
          isPlaying: false,
          isBuffering: true,
          isRecovering: false,
          isPlaybackPending: true,
          error: null,
        }));
        try {
          await engine.play();
        } catch (error) {
          console.warn('[preview] resume failed', error);
          if (activeIdRef.current === soundscape.id) reset(FAILED_MESSAGE);
        }
        return;
      }

      const track = toPreviewTrack(soundscape);
      if (!track) return;

      const request = ++requestRef.current;
      activeIdRef.current = soundscape.id;
      playingRef.current = true;
      startedRef.current = false;
      pendingPositionRef.current = 0;
      positionRef.current = 0;
      setState({
        activeId: soundscape.id,
        isPlaying: false,
        isBuffering: true,
        isRecovering: false,
        isPlaybackPending: true,
        position: 0,
        // A clip's real length arrives from the player once it loads; only the
        // full-file fallback has a length known up front.
        duration: track.duration ?? 0,
        error: null,
      });

      try {
        if (!(await engine.setup())) {
          if (request === requestRef.current) reset(UNAVAILABLE_MESSAGE);
          return;
        }

        // Loading also re-publishes the lock-screen metadata for this track.
        await engine.load(track);
        // A newer tap, or a pause, may have landed while the source was opening.
        if (request !== requestRef.current || !playingRef.current) return;
        await engine.play();
      } catch (error) {
        console.warn('[preview] playback failed', error);
        if (request === requestRef.current) {
          // `load` may already have published the track to the lock screen.
          reset(FAILED_MESSAGE);
          void engine.reset();
        }
      }
    },
    [pauseActive, reset]
  );

  return { ...state, toggle, stop };
}
