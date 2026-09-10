import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioMetadata,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

import type { EngineListeners, PlayableTrack, PlayerEngine } from './types';

/**
 * expo-audio wrapper. Everything the app does to audio goes through here, so no
 * screen imports the audio library directly — which also keeps `engine.web.ts`
 * able to stand in for it on web.
 *
 * One long lived `AudioPlayer` holds the active soundscape. The app queue stays
 * in `PlayerProvider`, so loading a track only ever replaces this one source.
 */

/** expo-audio's own default, and the cadence the slider was built against. */
const STATUS_INTERVAL_MS = 500;

/** The 10s skip buttons expo-audio drives natively from the media session. */
const LOCK_SCREEN_OPTIONS = { showSeekForward: true, showSeekBackward: true };

const END_TONE_VOLUME = 0.7;
/** Releases the end tone even if its finish event never lands. */
const END_TONE_FAILSAFE_MS = 30_000;

type Subscription = { remove: () => void };

let setupPromise: Promise<boolean> | null = null;
let ready = false;
let player: AudioPlayer | null = null;
let statusSubscription: Subscription | null = null;

/** Android reports `didJustFinish` on every tick while ended, so end once only. */
let completionFired = false;
/** Set while a source is loaded, so an idle player never reports as buffering. */
let hasSource = false;
/** A start offset can only be applied once the new source has loaded; see `load`. */
let pendingSeekSeconds = 0;

// Last values handed to subscribers, so an idle player emits nothing.
let lastPosition = -1;
let lastDuration = -1;
let lastIsPlaying = false;
let lastIsBuffering = false;

const listenerSets = new Set<EngineListeners>();

function emit<K extends keyof EngineListeners>(
  event: K,
  ...args: Parameters<NonNullable<EngineListeners[K]>>
) {
  for (const listeners of listenerSets) {
    const handler = listeners[event] as ((...a: unknown[]) => void) | undefined;
    handler?.(...args);
  }
}

/** Durations and positions arrive as NaN or -1 until a source is ready. */
function safeSeconds(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

function toMetadata(track: PlayableTrack): AudioMetadata {
  return {
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artwork,
  };
}

function pushProgress() {
  if (!player) return;

  try {
    const position = safeSeconds(player.currentTime);
    const duration = safeSeconds(player.duration);

    lastPosition = position;
    lastDuration = duration;
    emit('onProgress', { position, duration });
  } catch {
    // The player can be torn down between reads; the next status update recovers.
  }
}

function handleStatus(status: AudioStatus) {
  const isPlaying = status.playing;
  // A source still opening counts as buffering too, so the screens show the
  // spinner from the moment a track is chosen rather than once it is ready.
  const isBuffering = hasSource && (status.isBuffering || !status.isLoaded);

  if (isPlaying !== lastIsPlaying || isBuffering !== lastIsBuffering) {
    lastIsPlaying = isPlaying;
    lastIsBuffering = isBuffering;
    emit('onPlaybackChange', { isPlaying, isBuffering });
  }

  const duration = safeSeconds(status.duration);

  if (pendingSeekSeconds > 0 && status.isLoaded) {
    const target = duration > 0 ? Math.min(pendingSeekSeconds, duration) : pendingSeekSeconds;
    pendingSeekSeconds = 0;
    void player?.seekTo(target);
    return;
  }

  const position = safeSeconds(status.currentTime);
  if (position !== lastPosition || duration !== lastDuration) {
    lastPosition = position;
    lastDuration = duration;
    emit('onProgress', { position, duration });
  }

  if (status.didJustFinish && !completionFired) {
    completionFired = true;
    emit('onTrackEnd');
  }
}

function ensurePlayer(): AudioPlayer {
  if (player) return player;

  player = createAudioPlayer(null, { updateInterval: STATUS_INTERVAL_MS });
  statusSubscription = player.addListener('playbackStatusUpdate', handleStatus);

  return player;
}

function resetBookkeeping() {
  hasSource = false;
  completionFired = false;
  pendingSeekSeconds = 0;
  lastPosition = -1;
  lastDuration = -1;
  lastIsPlaying = false;
  lastIsBuffering = false;
}

/**
 * Fully releases the native player and media session. `createAudioPlayer` is
 * intentionally not lifecycle-managed by React, so every owner teardown must
 * call this explicitly.
 */
async function teardown(emitResetProgress: boolean) {
  const current = player;

  // Make concurrent calls observe the player as unavailable before touching
  // the native object. A future setup/load will create a fresh player.
  player = null;
  ready = false;
  setupPromise = null;

  statusSubscription?.remove();
  statusSubscription = null;

  if (current) {
    try {
      current.pause();
      // Both calls are intentional: clearLockScreenControls clears now-playing
      // state, while the explicit false mirrors the activation in `load`.
      current.clearLockScreenControls();
      current.setActiveForLockScreen(false);
      current.replace(null);
      current.remove();
    } catch (error) {
      console.warn('[player] native teardown failed', error);
    }
  }

  try {
    // Releases audio focus / the iOS audio session after the player is gone.
    await setIsAudioActiveAsync(false);
  } catch (error) {
    console.warn('[player] audio session teardown failed', error);
  }

  resetBookkeeping();
  emit('onPlaybackChange', { isPlaying: false, isBuffering: false });
  if (emitResetProgress) {
    emit('onProgress', { position: 0, duration: 0 });
  }
}

async function setup(): Promise<boolean> {
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    try {
      // The audio session has to be stated before anything plays: without it
      // the silent switch and the background keep-alive both default to off.
      // `doNotMix` takes the audio focus that the media session needs to own
      // the lock screen.
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: true,
        interruptionMode: 'doNotMix',
        allowsRecording: false,
      });
      await setIsAudioActiveAsync(true);

      ensurePlayer();
      ready = true;
      return true;
    } catch (error) {
      // Most often the native module is missing because the app is running in
      // Expo Go, which means playback is unavailable for this session.
      console.warn('[player] setup failed', error);
      // Cleared so a later attempt — a fast refresh, or a retry — can succeed.
      setupPromise = null;
      ready = false;
      return false;
    }
  })();

  return setupPromise;
}

export const engine: PlayerEngine = {
  setup,
  isAvailable: () => true,
  hasSource: () => hasSource,

  load: async (track: PlayableTrack, startAtSeconds = 0) => {
    if (!(await setup())) return;

    const current = ensurePlayer();

    completionFired = false;
    pendingSeekSeconds = Math.max(0, startAtSeconds);
    lastPosition = -1;
    lastDuration = -1;

    // `replace` keeps playing when the old source was playing, and the provider
    // decides when playback starts, so pause first and let it call `play`.
    current.pause();
    current.replace(track.url);
    hasSource = true;

    current.setActiveForLockScreen(true, toMetadata(track), LOCK_SCREEN_OPTIONS);

    // The screens show the new track's position before the source reports in.
    emit('onProgress', {
      position: pendingSeekSeconds,
      duration: safeSeconds(track.duration),
    });
  },

  play: async () => {
    if (!ready || !player) return;
    player.play();
  },

  pause: async () => {
    if (!ready || !player) return;
    player.pause();
  },

  /** Full stop that preserves provider progress for its resume offer. */
  stop: async () => {
    await teardown(false);
  },

  /** The full teardown: nothing is playing and nothing is on the lock screen. */
  reset: async () => {
    await teardown(true);
  },

  seekTo: async (seconds: number) => {
    if (!ready || !player) return;

    const duration = safeSeconds(player.duration);
    const target = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);

    // Scrubbing away from the end arms the completion callback again.
    pendingSeekSeconds = 0;
    completionFired = false;

    await player.seekTo(target);
    pushProgress();
  },

  setVolume: async (level: number) => {
    if (!ready || !player) return;
    // A property write, so the sleep timer's fade steps never reload the source.
    player.volume = Math.min(1, Math.max(0, level));
  },

  getProgress: async () => {
    if (!ready || !player) return { position: 0, duration: 0 };

    return {
      position: safeSeconds(player.currentTime),
      duration: safeSeconds(player.duration),
    };
  },

  subscribe: (listeners: EngineListeners) => {
    listenerSets.add(listeners);
    return () => {
      listenerSets.delete(listeners);
    };
  },

  /**
   * The Focus end tone is a one shot UI sound on its own short lived player, so
   * it never touches the lock screen or replaces the current soundscape.
   */
  playEndTone: async () => {
    try {
      const tone = createAudioPlayer(require('@/assets/audio/end-tone.wav'), {
        // Leaves the shared audio session up, so ending the chime cannot cut
        // anything else short. It is never made active for the lock screen.
        keepAudioSessionActive: true,
      });
      tone.volume = END_TONE_VOLUME;

      let released = false;
      let subscription: Subscription | null = null;
      let failsafe: ReturnType<typeof setTimeout> | null = null;

      const release = () => {
        if (released) return;
        released = true;

        if (failsafe) clearTimeout(failsafe);
        subscription?.remove();
        // Deferred so the player is not freed from inside its own event.
        setTimeout(() => tone.remove(), 0);
      };

      subscription = tone.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) release();
      });
      failsafe = setTimeout(release, END_TONE_FAILSAFE_MS);

      tone.play();
    } catch (error) {
      console.warn('[player] end tone failed', error);
    }
  },
};
