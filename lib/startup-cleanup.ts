import { Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  fetchNotificationArtwork,
  getCachedNotificationArtwork,
} from '@/lib/notification-artwork';
import { setArtworkCache } from '@/lib/player/types';

/**
 * Registered once, at import time, exactly where `lib/offline-audio.ts` used to
 * do it before the downloads feature it also wired up was removed. Injected
 * rather than imported directly by the engine so the engine and provider tests,
 * which load their files in a bare VM, never pull in `expo-file-system`. With
 * nothing registered the lock screen falls back to the remote artwork URL.
 */
setArtworkCache({
  cached: getCachedNotificationArtwork,
  fetch: fetchNotificationArtwork,
});

/** Removes audio left by the retired automatic recents cache. */
function cleanupLegacyRecentsAudio(): void {
  if (Platform.OS === 'web') return;

  try {
    const directory = new Directory(Paths.document, 'recents');
    if (directory.exists) directory.delete();
  } catch (error) {
    console.warn('[startup-cleanup] could not remove legacy recents audio', error);
  }
}

/**
 * Removes whatever the removed permanent-downloads feature left on disk: the
 * manifest, the saved audio and artwork, all of it under one folder. Checking
 * `exists` first keeps this a no-op after the first launch following the
 * removal, so there is nothing to gate on a persisted flag.
 */
function cleanupLegacyDownloads(): void {
  if (Platform.OS === 'web') return;

  try {
    const directory = new Directory(Paths.document, 'soundscapes');
    if (directory.exists) directory.delete();
  } catch (error) {
    console.warn('[startup-cleanup] could not remove legacy downloads', error);
  }
}

/** Runs the one-time disk cleanups left over from retired features. */
export async function runStartupCleanup(): Promise<void> {
  cleanupLegacyRecentsAudio();
  cleanupLegacyDownloads();
}
