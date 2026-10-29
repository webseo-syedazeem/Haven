import type { Soundscape } from '@/lib/api/home';

export type PlayerDiagnostic = {
  event: 'load' | 'play' | 'pause' | 'recovery' | 'failed' | 'session_error';
  trackId?: string;
  attempt?: number;
  reason?: string;
};

let diagnosticReporter: ((event: PlayerDiagnostic) => void) | null = null;
export function setPlayerDiagnosticReporter(reporter: (event: PlayerDiagnostic) => void) {
  diagnosticReporter = reporter;
}
export function reportPlayerDiagnostic(event: PlayerDiagnostic) {
  // Monitoring must never break playback. Deliberately exclude URLs and titles.
  try { diagnosticReporter?.(event); } catch { /* best effort */ }
}

/** The minimum a soundscape needs before it can be handed to the audio engine. */
export type PlayableTrack = {
  id: string;
  url: string;
  title: string;
  artist: string;
  isLoop: boolean;
  artwork?: string;
  duration?: number;
};

export type EngineListeners = {
  onPlaybackChange?: (state: { isPlaying: boolean; isBuffering: boolean }) => void;
  /**
   * `trackId` is the track this position was captured for — null for an event
   * that is not about any one track (e.g. a full reset). A listener that
   * tracks "the current track" should drop a non-null id that does not match
   * it, since an event can still be in flight when a newer track is loaded.
   */
  onProgress?: (progress: { position: number; duration: number; trackId: string | null }) => void;
  onTrackEnd?: () => void;
  /**
   * The source stopped and automatic reloads could not revive it. The engine
   * has already released its native player, so the next `load` starts afresh.
   */
  onPlaybackFailed?: () => void;
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
  /** Allow or prevent the active soundscape from continuing while the app is backgrounded. */
  setBackgroundPlayback: (enabled: boolean) => Promise<void>;
  /** The "Continuous loop" preference. Applies live to the active player with no restart. */
  setLoopEnabled: (enabled: boolean) => void;
  getProgress: () => Promise<{ position: number; duration: number }>;
  subscribe: (listeners: EngineListeners) => () => void;
};

export type EngineOptions = {
  /** Show now-playing controls on the lock screen. Defaults to true. */
  lockScreen?: boolean;
  /**
   * Whether this engine is the only thing that uses the lock screen. Only an
   * owner may force the lock screen off on teardown: expo-audio has one global
   * lock-screen slot, and deactivating through the player clears whichever
   * player holds it (on iOS unconditionally). A scoped engine passes false so
   * it only ever clears its own controls. Defaults to true.
   */
  ownsLockScreen?: boolean;
  /**
   * Deactivate the shared audio session when the engine is torn down. A
   * screen-scoped engine turns this off so ending it cannot silence the app
   * player that shares the session. Defaults to true.
   */
  releaseAudioSession?: boolean;
};

/** A copy of the soundscape already saved to this device. */
export type LocalSource = { url: string; artwork?: string };

let resolveLocalSource: ((soundscapeId: string) => LocalSource | null) | null = null;

/**
 * Nothing registers a resolver any more — the permanent-downloads feature that
 * used to call this from `lib/local-downloads.ts` has been removed — so the
 * player always streams. The hook stays because removing it would mean
 * reworking `toPlayableTrack` below and the error-message branching in
 * `PlayerProvider.tsx` that still calls `hasLocalSource`, for a code path that
 * is already fully inert.
 *
 * Injected rather than imported so the player never pulls `expo-file-system`
 * into its module graph — the engine and provider tests load these files in a
 * bare VM with no native modules.
 */
export function setLocalSourceResolver(
  resolver: ((soundscapeId: string) => LocalSource | null) | null
) {
  resolveLocalSource = resolver;
}

/** Local copies of remote covers, so the lock screen never depends on its own fetch. */
export type ArtworkCache = {
  /** The saved copy's URI, or null when there is none yet. Synchronous, so `load` never waits. */
  cached: (url: string) => string | null;
  /** Saves the cover and resolves its local URI, or null if it could not be saved. */
  fetch: (url: string) => Promise<string | null>;
};

let artworkCache: ArtworkCache | null = null;

/**
 * Registered once by `lib/startup-cleanup.ts` when it loads, for the same
 * reason as the local source resolver: the engine loads in a bare VM in tests.
 * With none registered the lock screen is given the remote URL.
 */
export function setArtworkCache(cache: ArtworkCache | null) {
  artworkCache = cache;
}

export function getArtworkCache(): ArtworkCache | null {
  return artworkCache;
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
    isLoop: soundscape.is_loop ?? false,
    artwork: local?.artwork ?? (remoteArtwork || undefined),
    duration: soundscape.duration_seconds ?? undefined,
  };
}

/**
 * The onboarding preview plays the short clip made for it. The full file is
 * only a fallback for a row that has no clip yet, and a download is never
 * used: a saved copy is the full soundscape, not the preview.
 */
export function toPreviewTrack(soundscape: Soundscape): PlayableTrack | null {
  const previewUrl = soundscape.preview_url?.trim();
  const url = previewUrl || soundscape.file_url?.trim();
  if (!url) return null;

  const artwork = soundscape.artwork_url?.trim();

  return {
    id: soundscape.id,
    url,
    title: soundscape.title,
    artist: 'Passage',
    isLoop: false,
    artwork: artwork || undefined,
    // `duration_seconds` is the full soundscape's length, so it only describes
    // the fallback. A clip's own length comes from the player once it loads.
    duration: previewUrl ? undefined : (soundscape.duration_seconds ?? undefined),
  };
}
