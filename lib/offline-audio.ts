import { Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  getLocalDownload,
  hydrateLocalDownloads,
  isLocallyAvailable,
} from '@/lib/local-downloads';
import {
  fetchNotificationArtwork,
  getCachedNotificationArtwork,
} from '@/lib/notification-artwork';
import { setArtworkCache, setLocalSourceResolver } from '@/lib/player/types';

/**
 * Wires permanent, user-initiated downloads into the player.
 *
 * They are registered from here rather than imported by the player because
 * `lib/player/types.ts` is loaded by the player tests in a bare VM: pulling
 * `expo-file-system` into that module graph would break them. It also keeps the
 * precedence rule in one readable place instead of split across two modules
 * that would each have to know about the other.
 */

/**
 * Where a soundscape's audio comes from, in order:
 *
 *   1. a permanent download — the user asked for this one, it is never evicted
 *   2. nothing, so the player streams the remote URL
 *
 * The first works with no connection; the second does not.
 *
 * Three things must all hold before a local file is handed to the player: the
 * row belongs to whoever is signed in on this device, it is marked completed,
 * and the bytes are still there. The last one is checked here and not only at
 * hydration because the account's server side download history says nothing
 * about *this* device — a fresh install restores the account, not the files —
 * and because a file can be reclaimed while the app is running. A missing file
 * falls through to streaming rather than opening a track that cannot play.
 */
setLocalSourceResolver((soundscapeId) => {
  if (!isLocallyAvailable(soundscapeId)) return null;

  const download = getLocalDownload(soundscapeId);
  if (!download?.file_uri) return null;

  return { url: download.file_uri, artwork: download.artwork_uri ?? undefined };
});

setArtworkCache({
  cached: getCachedNotificationArtwork,
  fetch: fetchNotificationArtwork,
});

/** True when a permanent download can play without a connection. */
export function hasOfflineAudio(soundscapeId: string): boolean {
  return isLocallyAvailable(soundscapeId);
}

/** Removes audio left by the retired automatic recents cache. */
export function cleanupLegacyRecentsAudio(): void {
  if (Platform.OS === 'web') return;

  try {
    // This path is intentionally separate from permanent `soundscapes/` downloads.
    const directory = new Directory(Paths.document, 'recents');
    if (directory.exists) directory.delete();
  } catch (error) {
    console.warn('[offline-audio] could not remove legacy recents audio', error);
  }
}

/** Hydrates permanent downloads and removes the retired recents folder. */
export async function hydrateOfflineAudio(): Promise<void> {
  cleanupLegacyRecentsAudio();
  await hydrateLocalDownloads();
}
