import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  coverCandidateUrls,
  initialCachedCoverUrls,
  type CoverSize,
} from '@/lib/image-url';

/** Shared local artwork store for screens, the lock screen and notifications. */

// Keep the old folder name so artwork downloaded by earlier app versions is reused.
const FOLDER = 'notification-artwork';
const MAX_FILES = 180;
const FAILURE_COOLDOWN_MS = 30_000;

const isSupported = Platform.OS !== 'web';
const inflight = new Map<string, Promise<string | null>>();
const failedAt = new Map<string, number>();

function folder(): Directory {
  const directory = new Directory(Paths.cache, FOLDER);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

/** Stable filesystem-safe URL key (FNV-1a), preserving the image extension. */
function fileNameFor(url: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  const extension = /\.([a-z0-9]{2,5})$/i.exec(url.split('?')[0].split('#')[0]);
  return `${hash.toString(16)}${extension ? `.${extension[1].toLowerCase()}` : '.jpg'}`;
}

/**
 * Best immediately reusable copy. Original-quality requests only accept an
 * original here; their resized fallbacks are considered after network failure.
 */
export function getCachedArtwork(url: string, size: CoverSize): string | null {
  if (!isSupported) return null;
  if (!/^https?:\/\//i.test(url)) return url;

  try {
    const directory = folder();
    for (const candidate of initialCachedCoverUrls(url, size)) {
      const file = new File(directory, fileNameFor(candidate));
      if (file.exists && file.size > 0) return file.uri;
    }
    return null;
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
    // Housekeeping must never stop an image from being used.
  }
}

async function downloadCandidate(url: string): Promise<string | null> {
  if (!isSupported) return null;

  const pending = inflight.get(url);
  if (pending) return pending;

  const lastFailure = failedAt.get(url) ?? 0;
  if (Date.now() - lastFailure < FAILURE_COOLDOWN_MS) return null;

  try {
    const existing = new File(folder(), fileNameFor(url));
    if (existing.exists && existing.size > 0) return existing.uri;
  } catch {
    return null;
  }

  const job = (async () => {
    try {
      const directory = folder();
      const name = fileNameFor(url);
      const partial = new File(directory, `${name}.part`);
      if (partial.exists) partial.delete();

      const saved = await File.downloadFileAsync(url, partial, { idempotent: true });
      if (!saved.exists || saved.size <= 0) {
        if (saved.exists) saved.delete();
        failedAt.set(url, Date.now());
        return null;
      }

      const target = new File(directory, name);
      if (target.exists) target.delete();
      saved.move(target);
      failedAt.delete(url);
      prune(directory);
      return target.uri;
    } catch (error) {
      failedAt.set(url, Date.now());
      console.warn('[artwork-cache] could not cache cover candidate', error);
      return null;
    } finally {
      inflight.delete(url);
    }
  })();

  inflight.set(url, job);
  return job;
}

/** Download the requested size, then sibling sizes and the original as needed. */
export async function fetchArtwork(url: string, size: CoverSize): Promise<string | null> {
  if (!isSupported) return url;
  if (!/^https?:\/\//i.test(url)) return url;

  const existing = getCachedArtwork(url, size);
  if (existing) return existing;

  for (const candidate of coverCandidateUrls(url, size)) {
    const saved = await downloadCandidate(candidate);
    if (saved) return saved;
  }

  return null;
}

/** Preload screen data into the same cache CoverImage consumes. */
export async function prefetchArtwork(
  entries: { url: string | null | undefined; size: CoverSize }[]
): Promise<void> {
  if (!isSupported) return;

  const unique = new Map<string, { url: string; size: CoverSize }>();
  for (const entry of entries) {
    const url = entry.url?.trim();
    if (url) unique.set(`${entry.size}:${url}`, { url, size: entry.size });
  }

  await Promise.all(
    [...unique.values()].map(({ url, size }) => fetchArtwork(url, size).then(() => undefined))
  );
}

/** Notifications use md as a balanced quality/size choice. */
export function getCachedNotificationArtwork(url: string): string | null {
  return getCachedArtwork(url, 'md');
}

export function fetchNotificationArtwork(url: string): Promise<string | null> {
  return fetchArtwork(url, 'md');
}
