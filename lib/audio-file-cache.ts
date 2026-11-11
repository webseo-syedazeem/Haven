import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

import type { AudioFileCache } from '@/lib/player/types';

/**
 * Transparent on-device cache of recently played soundscape audio.
 *
 * This is NOT the removed user-facing downloads feature: there is no UI, no
 * "saved offline" library, and nothing the user manages. It simply keeps a
 * handful of the most recently played full-audio files so a replay starts
 * instantly and plays without network. The folder lives under the OS *cache*
 * directory, so the system may reclaim it under storage pressure.
 *
 * Playback always has priority. Caching only starts once a track has played
 * undisturbed for WARM_DELAY_MS (the user has settled and is listening, not
 * browsing), on Wi-Fi, one at a time — and the moment a new soundscape plays,
 * any in-progress download is cancelled so the new track's stream and artwork
 * get the network first.
 */

const DIR = `${FileSystem.cacheDirectory ?? ''}soundscape-audio/`;
// Caps: whichever is hit first evicts the oldest. ~60 one-hour tracks / 3 GB.
const MAX_FILES = 60;
const MAX_BYTES = 3 * 1024 * 1024 * 1024;
const FAILURE_COOLDOWN_MS = 60_000;
// Only start caching once a track has been playing undisturbed for this long —
// i.e. the user has settled and is actually listening, not browsing. Any new play
// restarts the window, so caching never competes with active use.
const WARM_DELAY_MS = 30_000;

const isSupported = Platform.OS !== 'web' && !!FileSystem.cacheDirectory;
const failedAt = new Map<string, number>();

// Playback-priority state.
let latestPlayAt = 0;
let latestTrackId: string | null = null;
let activeDownload: ReturnType<typeof FileSystem.createDownloadResumable> | null = null;
let downloading = false;

function fileNameFor(trackId: string): string {
  return `${trackId.replace(/[^a-zA-Z0-9_-]/g, '_')}.m4a`;
}

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

async function onWifi(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.type === Network.NetworkStateType.WIFI && state.isConnected !== false;
  } catch {
    return false;
  }
}

/** Cancel the active cache download so playback (stream + artwork) gets the network. */
function cancelActiveDownload(): void {
  const current = activeDownload;
  activeDownload = null;
  if (current) current.cancelAsync().catch(() => undefined);
}

/** Keep the cache within both caps by deleting the oldest files first. */
async function prune(): Promise<void> {
  try {
    const names = await FileSystem.readDirectoryAsync(DIR);
    const files: { uri: string; size: number; mtime: number }[] = [];
    for (const name of names) {
      if (name.endsWith('.part')) continue;
      const uri = `${DIR}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists && !info.isDirectory) {
        files.push({ uri, size: info.size ?? 0, mtime: info.modificationTime ?? 0 });
      }
    }

    files.sort((a, b) => a.mtime - b.mtime); // oldest first
    let total = files.reduce((sum, file) => sum + file.size, 0);
    let count = files.length;

    for (const file of files) {
      if (count <= MAX_FILES && total <= MAX_BYTES) break;
      await FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => undefined);
      total -= file.size;
      count -= 1;
    }
  } catch {
    // Housekeeping must never break playback.
  }
}

async function cachedUri(trackId: string): Promise<string | null> {
  if (!isSupported) return null;
  try {
    const uri = `${DIR}${fileNameFor(trackId)}`;
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists && (info.size ?? 0) > 0 ? uri : null;
  } catch {
    return null;
  }
}

async function download(trackId: string, url: string): Promise<void> {
  if (downloading) return;
  downloading = true;

  const dest = `${DIR}${fileNameFor(trackId)}`;
  const tmp = `${dest}.part`;

  try {
    const existing = await FileSystem.getInfoAsync(dest);
    if (existing.exists && (existing.size ?? 0) > 0) return;

    // Only fill the cache on Wi-Fi so we never spend a user's mobile data.
    if (!(await onWifi())) return;

    await ensureDir();
    await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => undefined);

    const resumable = FileSystem.createDownloadResumable(url, tmp);
    activeDownload = resumable;

    let result: FileSystem.FileSystemDownloadResult | undefined;
    try {
      result = await resumable.downloadAsync();
    } catch {
      result = undefined; // cancelled (new play) or a network error
    }

    // A new play cancelled this download — not a failure; clean up and yield.
    if (activeDownload !== resumable) {
      await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => undefined);
      return;
    }
    activeDownload = null;

    if (!result || (result.status !== 200 && result.status !== 206)) {
      await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => undefined);
      failedAt.set(trackId, Date.now());
      return;
    }

    const info = await FileSystem.getInfoAsync(tmp);
    if (!info.exists || (info.size ?? 0) <= 0) {
      await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => undefined);
      failedAt.set(trackId, Date.now());
      return;
    }

    await FileSystem.deleteAsync(dest, { idempotent: true }).catch(() => undefined);
    await FileSystem.moveAsync({ from: tmp, to: dest });
    failedAt.delete(trackId);
    await prune();
  } catch {
    failedAt.set(trackId, Date.now());
    await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => undefined);
  } finally {
    downloading = false;
  }
}

/**
 * A (possibly cached) soundscape just started → cancel any in-progress cache
 * download so the new track's stream and artwork get the network first. Called
 * on EVERY play, cached or streamed.
 */
function notePlay(_trackId: string): void {
  if (!isSupported) return;
  cancelActiveDownload();
}

function warm(trackId: string, url: string): void {
  if (!isSupported) return;

  // A (new) play just happened → give the stream + artwork the network NOW:
  // cancel any in-progress cache download and restart the quiet window.
  latestPlayAt = Date.now();
  latestTrackId = trackId;
  cancelActiveDownload();

  const lastFailure = failedAt.get(trackId) ?? 0;
  if (Date.now() - lastFailure < FAILURE_COOLDOWN_MS) return;

  // Cache this track only if nothing newer has played during the quiet window.
  setTimeout(() => {
    if (latestTrackId !== trackId) return;
    if (Date.now() - latestPlayAt < WARM_DELAY_MS) return;
    void download(trackId, url);
  }, WARM_DELAY_MS);
}

export const audioFileCache: AudioFileCache = { cachedUri, warm, notePlay };
