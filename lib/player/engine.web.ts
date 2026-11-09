import type { PlayerEngine } from './types';

/**
 * expo-audio needs a native module for the media session and background
 * playback the app relies on: on web the app renders the player UI but playback
 * stays unavailable, so every call is a no-op rather than a crash. Keeping this
 * file separate is also what stops the web bundle pulling the native module in.
 *
 * Protected audio (/soundscapes/*) is not supported on web: a <audio> / media
 * element cannot have custom request headers, so Bearer tokens cannot be
 * delivered with Range requests. The app is iOS-only; this stub exists only to
 * let the web bundle compile cleanly.
 */
const noop = async () => {};

export const createPlayerEngine = (): PlayerEngine => ({
  setup: async () => false,
  isAvailable: () => false,
  hasSource: () => false,
  load: noop,
  play: noop,
  pause: noop,
  stop: noop,
  reset: noop,
  seekTo: noop,
  setVolume: noop,
  setBackgroundPlayback: noop,
  setLoopEnabled: () => {},
  getProgress: async () => ({ position: 0, duration: 0 }),
  subscribe: () => () => {},
});

export const engine: PlayerEngine = createPlayerEngine();
