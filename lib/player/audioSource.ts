import type { AudioSource } from 'expo-audio';
import { API_BASE_URL, resolveRequestToken } from '@/lib/api/client';
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
 * Builds the AudioSource for expo-audio's `replace()`.
 *
 * - /soundscapes/* (any host, including CDN) → `{ uri, headers: { Authorization: Bearer <token> } }`
 *   The URI is always rewritten to API_BASE_URL so the token goes directly to
 *   origin and never to CloudFront (which strips Authorization before forwarding).
 * - /previews/* or any other path → plain URL string, no token attached
 *
 * The token is resolved live on every call so expiry mid-session gets a fresh
 * value on the next reload, without ever caching the token in track objects or
 * persisted player state.
 */
export async function buildAudioSource(track: PlayableTrack): Promise<AudioSource> {
  if (!isSoundscapePath(track.url)) {
    return track.url;
  }

  const { token } = await resolveRequestToken();
  if (!token) {
    // No active session — return the plain URL and let the player fail naturally
    // so the existing error state surfaces to the user.
    return track.url;
  }

  return {
    uri: toApiUri(track.url),
    headers: { Authorization: `Bearer ${token}` },
  };
}
