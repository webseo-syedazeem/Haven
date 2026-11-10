import type { AudioSource } from 'expo-audio';
import { API_BASE_URL, resolveRequestToken } from '@/lib/api/client';
import { supabase } from '@/lib/supabase';
import type { PlayableTrack } from './types';

// Matches any URL whose path starts with /soundscapes/ — works for API host,
// CDN host (CloudFront), or relative paths. Host is intentionally not checked
// here because toApiUri always rewrites to API_BASE_URL before the token is
// attached, so the token never reaches a foreign host.
function isSoundscapePath(url: string): boolean {
  try {
    const pathname = /^https?:\/\//i.test(url) ? new URL(url).pathname : url;
    return pathname.startsWith('/soundscapes/');
  } catch {
    return url.startsWith('/soundscapes/');
  }
}

// Always rewrites the URL to use API_BASE_URL as the host. This bypasses
// CloudFront (and any other CDN), which strips Authorization headers before
// forwarding to origin. The Bearer token is delivered directly to the backend.
function toApiUri(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    try {
      const { pathname, search } = new URL(url);
      return `${API_BASE_URL}${pathname}${search}`;
    } catch { /* fall through */ }
  }
  return `${API_BASE_URL}${url}`;
}

/**
 * A soundscape stream is uniquely long-lived: the native player attaches the
 * Bearer token once and reuses that one value for the whole stream — every Range
 * request, in the background, for an hour or more. Our API-side refresh-on-401
 * does not reach it. So the token handed to a stream must be both present *and*
 * not about to expire, which a one-shot API call never has to care about.
 */
const STREAM_TOKEN_MIN_REMAINING_MS = 5 * 60_000;

/**
 * Resolves a Bearer token fit for a long-lived stream:
 *
 * - No token yet (the session is still hydrating at launch, or is mid-refresh):
 *   force one refresh and re-resolve before giving up, so a stream never starts
 *   with no Authorization header — that was the "token missing" 401.
 * - A live Supabase (Apple/Google) token is the only kind that can silently go
 *   stale mid-stream, because only supabase-js can refresh its rotating token.
 *   If it is within `STREAM_TOKEN_MIN_REMAINING_MS` of expiry, refresh it now so
 *   the stream starts on a full-length token instead of one that dies minutes in.
 *
 * Every refresh failure is swallowed: refreshing needs the network, and offline
 * the caller should still get whatever token it has and let the stall-watchdog
 * ([engine.ts] reload) retry.
 */
async function resolveStreamToken(): Promise<string | null> {
  const resolved = await resolveRequestToken();

  if (!resolved.token) {
    await supabase.auth.refreshSession().catch(() => undefined);
    return (await resolveRequestToken()).token;
  }

  if (resolved.source === 'supabase') {
    try {
      const { data } = await supabase.auth.getSession();
      const expiresAtSeconds = data.session?.expires_at;
      const expiresSoon =
        typeof expiresAtSeconds === 'number' &&
        expiresAtSeconds * 1_000 - Date.now() < STREAM_TOKEN_MIN_REMAINING_MS;

      if (expiresSoon) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        return refreshed.session?.access_token ?? resolved.token;
      }
    } catch {
      // Keep the token we already have; the watchdog retries if the stream fails.
    }
  }

  return resolved.token;
}

/**
 * Builds the AudioSource for expo-audio's `replace()`.
 *
 * - /soundscapes/* (any host, including CDN) → `{ uri, headers: { Authorization: Bearer <token> } }`
 *   The URI is always rewritten to API_BASE_URL so the token goes directly to
 *   origin and never to CloudFront (which strips Authorization before forwarding).
 * - /previews/* or any other path → plain URL string, no token attached
 *
 * The token is resolved (and, for a soundscape, kept fresh) live on every call so
 * expiry mid-session gets a fresh value on the next reload, without ever caching
 * the token in track objects or persisted player state.
 */
export async function buildAudioSource(track: PlayableTrack): Promise<AudioSource> {
  if (!isSoundscapePath(track.url)) {
    return track.url;
  }

  const token = await resolveStreamToken();
  if (!token) {
    // Still no session even after a refresh attempt — return the plain URL and
    // let the player fail naturally so the existing error state surfaces.
    return track.url;
  }

  return {
    uri: toApiUri(track.url),
    headers: { Authorization: `Bearer ${token}` },
  };
}
