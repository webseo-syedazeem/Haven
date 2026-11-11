import type { AudioSource } from 'expo-audio';
import { apiClient } from '@/lib/api/client';
import { getAudioFileCache, type PlayableTrack } from './types';

// Matches any URL whose path starts with /soundscapes/ — works for the API host,
// the CDN host (CloudFront), or a relative path. The host is deliberately not
// checked: a soundscape is always played through a short-lived signed URL, so
// the access proof lives in the URL itself and never in a header.
function isSoundscapePath(url: string): boolean {
  try {
    const pathname = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
    return pathname.startsWith('/soundscapes/');
  } catch {
    return url.startsWith('/soundscapes/');
  }
}

type StreamUrlResponse = {
  data: { url: string; expires_at: number };
};

/**
 * Signed playback URLs the backend has already handed out, cached per track so a
 * watchdog reload (or a quick pause/resume) does not mint a fresh one every time.
 * Keyed by track id; value is the URL and its expiry in Unix seconds.
 */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/** Re-sign once a cached URL is within this window of expiring. */
const SIGNED_URL_SAFETY_MS = 60_000;

/**
 * Asks the backend for a short-lived *signed* stream URL for this soundscape.
 *
 * A signed URL proves access through its `?exp=&sig=` query string, so it plays
 * as a plain public URL — no Authorization header — which lets the CDN edge cache
 * and serve the audio instead of the app streaming every byte from the origin.
 *
 * Returns null only on a transient failure (offline, or the `/stream` call did
 * not succeed). The caller then returns the plain URL so the stall-watchdog
 * ([engine.ts] reload) retries, by which time `/stream` has usually recovered.
 */
async function resolveSignedStreamUrl(track: PlayableTrack): Promise<string | null> {
  const cached = signedUrlCache.get(track.id);
  if (cached && cached.expiresAt * 1_000 - Date.now() > SIGNED_URL_SAFETY_MS) {
    return cached.url;
  }

  try {
    const res = await apiClient<StreamUrlResponse>(
      `/api/soundscapes/${encodeURIComponent(track.id)}/stream`
    );

    if (res.data?.url && typeof res.data.expires_at === 'number') {
      signedUrlCache.set(track.id, { url: res.data.url, expiresAt: res.data.expires_at });
      return res.data.url;
    }

    signedUrlCache.delete(track.id);
    return null;
  } catch {
    return null;
  }
}

/**
 * Builds the AudioSource for expo-audio's `replace()`.
 *
 * - /soundscapes/* → first a local cached copy (instant replay, offline); else a
 *   short-lived signed URL (plain string, no header) served and cached from the
 *   CDN edge, with the file warmed into the on-device cache for next time. On a
 *   transient failure the plain URL is returned, which fails and lets the engine
 *   watchdog retry.
 * - /previews/* or any other path → plain URL string (previews are public).
 *
 * Nothing sensitive is persisted: the signed URL is minted live and only
 * memoised briefly in memory, never stored on the track or in player state.
 */
export async function buildAudioSource(track: PlayableTrack): Promise<AudioSource> {
  if (!isSoundscapePath(track.url)) {
    return track.url;
  }

  const cache = getAudioFileCache();

  // Any new play (cached or streamed) must stop an in-progress cache download so
  // this track's stream + artwork get the network first.
  cache?.notePlay(track.id);

  // Instant replay: play the local copy if this soundscape is already cached.
  if (cache) {
    const localUri = await cache.cachedUri(track.id);
    if (localUri) {
      return localUri;
    }
  }

  const signedUrl = await resolveSignedStreamUrl(track);
  if (signedUrl) {
    // Warm the on-device cache in the background so the next replay is instant.
    cache?.warm(track.id, signedUrl);
    return signedUrl;
  }

  // Couldn't mint a signed URL right now (offline / transient). Return the plain
  // URL; it will fail and the watchdog will retry once /stream recovers.
  return track.url;
}
