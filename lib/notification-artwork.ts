import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Local copies of soundscape covers for the lock screen and notification.
 *
 * expo-audio fetches a remote `artworkUrl` itself, once per URL and with no
 * retry: on Android `AudioControlsService` records the URL before the request
 * and never asks again if it failed, so one dropped request left the
 * notification without a cover until the app restarted. It also has no
 * connection to fall back on offline. A `file://` copy on disk avoids both, and
 * is the form the native side reads fastest.
 *
 * The cache directory is used on purpose: these are disposable, and the OS may
 * reclaim them.
 */

const FOLDER = 'notification-artwork';
/** Covers are ~300 KB each; this keeps the folder to a few tens of MB at most. */
const MAX_FILES = 60;

const isSupported = Platform.OS !== 'web';
const inflight = new Map<string, Promise<string | null>>();

function folder(): Directory {
  const directory = new Directory(Paths.cache, FOLDER);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

/** A stable, filesystem-safe name for a URL (FNV-1a), keeping its extension. */
function fileNameFor(url: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  const extension = /\.([a-z0-9]{2,5})$/i.exec(url.split('?')[0].split('#')[0]);
  return `${hash.toString(16)}${extension ? `.${extension[1].toLowerCase()}` : '.jpg'}`;
}

/** The saved copy's `file://` URI, or null when this cover has not been saved. */
export function getCachedNotificationArtwork(url: string): string | null {
  if (!isSupported) return null;

  try {
    const file = new File(folder(), fileNameFor(url));
    return file.exists && file.size > 0 ? file.uri : null;
  } catch {
    return null;
  }
}

function prune(directory: Directory) {
  try {
    const files = directory
      .list()
      .filter((entry): entry is File => entry instanceof File && !entry.name.endsWith('.part'));
    if (files.length <= MAX_FILES) return;

    files
      .sort((a, b) => (a.modificationTime ?? 0) - (b.modificationTime ?? 0))
      .slice(0, files.length - MAX_FILES)
      .forEach((file) => file.delete());
  } catch {
    // Housekeeping only: an oversized cache costs disk, never playback.
  }
}

/** Downloads a cover once, whatever the number of callers, and resolves its local URI. */
export function fetchNotificationArtwork(url: string): Promise<string | null> {
  if (!isSupported) return Promise.resolve(null);

  const pending = inflight.get(url);
  if (pending) return pending;

  const job = (async () => {
    try {
      const existing = getCachedNotificationArtwork(url);
      if (existing) return existing;

      const directory = folder();
      const name = fileNameFor(url);
      // Downloaded beside the final name and moved into place, so a request cut
      // short can never leave a half-written file that reads as a cached cover.
      const partial = new File(directory, `${name}.part`);
      if (partial.exists) partial.delete();

      const saved = await File.downloadFileAsync(url, partial, { idempotent: true });
      if (!saved.exists || saved.size <= 0) {
        if (saved.exists) saved.delete();
        return null;
      }

      const target = new File(directory, name);
      if (target.exists) target.delete();
      saved.move(target);
      prune(directory);
      return target.uri;
    } catch (error) {
      console.warn('[notification-artwork] could not cache cover', error);
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, job);
  return job;
}
