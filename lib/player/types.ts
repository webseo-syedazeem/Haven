import type { Soundscape } from '@/lib/api/home';

/** The minimum a soundscape needs before it can be handed to the audio engine. */
export type PlayableTrack = {
  id: string;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
};

export type EngineListeners = {
  onPlaybackChange?: (state: { isPlaying: boolean; isBuffering: boolean }) => void;
  onProgress?: (progress: { position: number; duration: number }) => void;
  onTrackEnd?: () => void;
  /**
   * Skip requests from the lock screen or notification. No engine emits these
   * today — expo-audio's media session exposes play, pause and seek only — so
   * next and previous are reachable from inside the app alone. The hooks stay
   * because the provider already routes them to its queue, ready for the day a
   * media session offers the commands.
   */
  onRemoteNext?: () => void;
  onRemotePrevious?: () => void;
};

export type PlayerEngine = {
  /** Idempotent; safe to call on every provider mount. */
  setup: () => Promise<boolean>;
  isAvailable: () => boolean;
  hasSource: () => boolean;
  load: (track: PlayableTrack, startAtSeconds?: number) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setVolume: (level: number) => Promise<void>;
  getProgress: () => Promise<{ position: number; duration: number }>;
  subscribe: (listeners: EngineListeners) => () => void;
  /** One short chime for the Focus end-of-timer option. */
  playEndTone: () => Promise<void>;
};

/** A copy of the soundscape already saved to this device. */
export type LocalSource = { url: string; artwork?: string };

let resolveLocalSource: ((soundscapeId: string) => LocalSource | null) | null = null;

/**
 * Registered once by `lib/local-downloads.ts` when it loads.
 *
 * Injected rather than imported so the player never pulls `expo-file-system`
 * into its module graph — the engine and provider tests load these files in a
 * bare VM with no native modules. With no resolver registered (tests, web) the
 * player simply streams, exactly as it did before downloads existed.
 */
export function setLocalSourceResolver(
  resolver: ((soundscapeId: string) => LocalSource | null) | null
) {
  resolveLocalSource = resolver;
}

/** True when this soundscape can play with no connection. */
export function hasLocalSource(soundscapeId: string): boolean {
  return !!resolveLocalSource?.(soundscapeId);
}

/**
 * A downloaded soundscape plays from the file on disk, which is what makes it
 * work with no connection. Streaming is the fallback, not the default.
 */
export function toPlayableTrack(soundscape: Soundscape): PlayableTrack | null {
  const local = resolveLocalSource?.(soundscape.id) ?? null;
  const url = local?.url ?? soundscape.file_url?.trim();
  if (!url) return null;

  const remoteArtwork = soundscape.artwork_url?.trim();

  return {
    id: soundscape.id,
    url,
    title: soundscape.title,
    artist: 'Passage',
    artwork: local?.artwork ?? (remoteArtwork || undefined),
    duration: soundscape.duration_seconds ?? undefined,
  };
}
