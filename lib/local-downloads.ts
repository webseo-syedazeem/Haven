import { Directory, File, Paths } from 'expo-file-system';
import { createDownloadResumable } from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

import type { Soundscape, SoundscapeMode } from '@/lib/api/home';

/**
 * The device's own record of what has been downloaded — the source of truth for
 * the Downloads list, for the "Saved" state on a soundscape, and for which file
 * the player opens.
 *
 * The server's `/api/downloads` rows are a convenience for other devices; they
 * are written best effort and nothing here waits on them. An offline app has to
 * answer "what do I have, and where is it" from disk alone, which is exactly
 * what the manifest below is for.
 *
 * Layout under the document directory (persistent — the cache directory is
 * purged by the OS under storage pressure, which would silently empty the
 * feature):
 *
 *   soundscapes/.nomedia           media scanner guard, Android only
 *   soundscapes/manifest.json      the entries
 *   soundscapes/<id>.mp3           the audio
 *   soundscapes/artwork/.nomedia
 *   soundscapes/artwork/<id>.jpg   the cover, so the list draws offline too
 *
 * OWNERSHIP: a device is shared, an account is not. Every entry carries the
 * `owner_user_id` of whoever downloaded it, and the manifest holds one
 * `active_user_id` pointer for whoever is signed in on this device right now.
 * Every read path below answers "what does the *active* user have", so one
 * account's downloads are invisible to the next. Nothing is ever deleted for
 * this reason: the files and the rows stay exactly where they are, so signing
 * back in brings them straight back. An entry with no owner (written before
 * this rule existed) is shown to nobody rather than to everybody.
 *
 * PRIVACY: everything lives inside the app's own sandbox and must stay there.
 * `Paths.document` is internal storage on Android (`/data/data/<pkg>/files`),
 * which no other app can read and the media scanner never walks, and the app
 * container on iOS, which is invisible to Files because this app does not set
 * `UIFileSharingEnabled` or `LSSupportsOpeningDocumentsInPlace`. Nothing here
 * may ever be written to external/shared storage, handed to MediaStore, or put
 * through a media-library or share API — that is what would make a download
 * show up in the gallery or another audio player. The `.nomedia` markers below
 * are a second line of defence for OEM scanners that index more than they
 * should.
 */

const ROOT_FOLDER = 'soundscapes';
const ARTWORK_FOLDER = 'artwork';
const MANIFEST_NAME = 'manifest.json';
const NO_MEDIA_NAME = '.nomedia';
const MANIFEST_VERSION = 2;

/** Native only: there is no persistent file system to download into on web. */
const isSupported = Platform.OS !== 'web';

export type LocalDownloadStatus = 'queued' | 'downloading' | 'completed' | 'failed';

/** One downloaded soundscape, as the device knows it. */
export type LocalDownload = {
  soundscape_id: string;
  /**
   * The `auth_user_id` of whoever downloaded this, or `null` for a row written
   * before ownership existed. A `null` belongs to nobody and is shown to
   * nobody — the safe direction, since the alternative leaks one account's
   * library to the next person to use the device.
   */
  owner_user_id: string | null;
  title: string;
  short_title: string | null;
  one_line_description: string | null;
  mode: SoundscapeMode | null;
  duration_seconds: number | null;
  /** Optional on disk so manifests written before loop metadata remain readable. */
  is_loop?: boolean;
  quality: 'standard' | 'high';
  /** The remote source, kept so a failed entry can be retried later. */
  file_url: string | null;
  /** `file://` URI of the saved audio. Null until the file is fully written. */
  file_uri: string | null;
  artwork_url: string | null;
  artwork_uri: string | null;
  file_size_bytes: number;
  progress_percent: number;
  status: LocalDownloadStatus;
  updated_at: string;
};

type ManifestFile = {
  version: number;
  entries: LocalDownload[];
  /** Whoever is signed in on this device; see `getActiveDownloadUserId`. */
  active_user_id?: string | null;
};

export type LocalDownloadsSnapshot = {
  /** Every row on disk, both users' and all. Read `visibleEntries` instead. */
  entries: LocalDownload[];
  /** The active user's completed-or-pending rows — what the UI may show. */
  visibleEntries: LocalDownload[];
  /** The signed-in user this device is currently showing downloads for. */
  activeUserId: string | null;
  /** False until the manifest has been read off disk once. */
  hydrated: boolean;
};

// ── Store ────────────────────────────────────────────────────────────────────

let snapshot: LocalDownloadsSnapshot = {
  entries: [],
  visibleEntries: [],
  activeUserId: null,
  hydrated: false,
};
const listeners = new Set<() => void>();

/**
 * The rows the active user owns. A device with nobody signed in owns nothing,
 * so a signed-out app shows an empty Downloads list while every file stays put.
 */
function visibleFor(entries: LocalDownload[], activeUserId: string | null): LocalDownload[] {
  if (!activeUserId) return [];
  return entries.filter((entry) => entry.owner_user_id === activeUserId);
}

/** `useSyncExternalStore` needs a stable reference, so the object is replaced. */
export function getLocalDownloadsSnapshot(): LocalDownloadsSnapshot {
  return snapshot;
}

export function subscribeToLocalDownloads(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: Partial<LocalDownloadsSnapshot>) {
  const merged = { ...snapshot, ...next };
  // `visibleEntries` is derived, never passed in, so it can never disagree with
  // the rows and the pointer it is built from.
  snapshot = { ...merged, visibleEntries: visibleFor(merged.entries, merged.activeUserId) };
  for (const listener of listeners) listener();
}

/** Whoever this device is currently showing downloads for; `null` when signed out. */
export function getActiveDownloadUserId(): string | null {
  return snapshot.activeUserId;
}

/**
 * Points the manifest at a user, on sign in and on every session restore.
 * Their own rows become visible again the moment this lands — nothing is
 * migrated, copied or re-downloaded, because their files never went anywhere.
 */
export async function setActiveDownloadUser(userId: string | null): Promise<void> {
  await hydrateLocalDownloads();
  const next = userId?.trim() || null;
  if (snapshot.activeUserId === next) return;

  commit({ activeUserId: next });
  persist();
}

/**
 * Drops the pointer on logout. The rows and the audio stay on disk untouched;
 * only the answer to "whose downloads are these" changes, which is what makes
 * them disappear from the UI immediately rather than at the next launch.
 */
export async function clearActiveDownloadUser(): Promise<void> {
  await setActiveDownloadUser(null);
}

/**
 * One owner's row for a soundscape — the mutation lookup, never the display
 * one. Both halves of the key matter: two accounts can hold the same
 * soundscape, and each has to be able to write its own row without touching
 * the other's.
 */
function findEntry(soundscapeId: string, ownerUserId: string | null): LocalDownload | undefined {
  return snapshot.entries.find(
    (entry) => entry.soundscape_id === soundscapeId && entry.owner_user_id === ownerUserId
  );
}

/**
 * The active user's row for a soundscape, or `undefined`. Everything that asks
 * "is this downloaded" goes through here, so another account's copy can never
 * answer yes.
 */
export function getLocalDownload(soundscapeId: string): LocalDownload | undefined {
  return snapshot.visibleEntries.find((entry) => entry.soundscape_id === soundscapeId);
}

/**
 * True when this soundscape can play with no connection: the active user owns
 * a completed row *and* the bytes are still on this device.
 *
 * The file check is what makes a new device honest. The server knows what the
 * account has downloaded anywhere; this knows what is actually here, and only
 * this may gate offline playback or a "downloaded" tick.
 */
export function isLocallyAvailable(soundscapeId: string): boolean {
  const entry = getLocalDownload(soundscapeId);
  return (
    entry?.status === 'completed' && !!entry.file_uri && fileHasBytes(entry.file_uri)
  );
}

/** True when at least one soundscape can be played with no connection. */
export function hasPlayableDownloads(): boolean {
  return snapshot.visibleEntries.some(
    (entry) => entry.status === 'completed' && !!entry.file_uri
  );
}

/**
 * Completed downloads only — the ones with bytes on disk behind them.
 *
 * Sums whatever it is handed, so the caller decides the scope; every caller
 * hands it the active user's rows, because the storage figure is describing
 * what *this* account is using, not what the folder happens to contain.
 */
export function summariseLocalDownloads(
  entries: LocalDownload[]
): { total_bytes: number; count: number } {
  const completed = entries.filter((entry) => entry.status === 'completed');

  return {
    total_bytes: completed.reduce((total, entry) => total + (entry.file_size_bytes || 0), 0),
    count: completed.length,
  };
}

// ── Paths ────────────────────────────────────────────────────────────────────

/**
 * An empty `.nomedia` tells Android's media scanner to skip the folder, so the
 * audio can never surface in the gallery or another player. App-private storage
 * is not scanned to begin with; this costs nothing and closes the gap on OEM
 * builds that scan more than stock Android does.
 */
function ensureNoMediaGuard(directory: Directory) {
  if (Platform.OS !== 'android') return;

  try {
    const marker = new File(directory, NO_MEDIA_NAME);
    if (!marker.exists) marker.create();
  } catch (error) {
    // The guard is belt-and-braces; failing to write it must not stop a
    // download landing in a directory that is already private.
    console.warn('[downloads] could not write the .nomedia guard', error);
  }
}

function rootDirectory(): Directory {
  const directory = new Directory(Paths.document, ROOT_FOLDER);
  if (!directory.exists) directory.create({ intermediates: true });
  ensureNoMediaGuard(directory);
  return directory;
}

function artworkDirectory(): Directory {
  const directory = new Directory(rootDirectory(), ARTWORK_FOLDER);
  if (!directory.exists) directory.create({ intermediates: true });
  ensureNoMediaGuard(directory);
  return directory;
}

/** The extension the URL implies, so the saved file keeps a usable type. */
function extensionFor(url: string, fallback: string): string {
  const path = url.split('?')[0].split('#')[0];
  const match = /\.([a-z0-9]{2,5})$/i.exec(path);
  return match ? `.${match[1].toLowerCase()}` : fallback;
}

/**
 * Named by owner *and* soundscape, so two accounts that saved the same track on
 * one device own two files. Sharing one path would mean User B's "remove all"
 * deleting the bytes out from under User A's row, which is exactly what the
 * ownership rule exists to prevent.
 */
function fileStem(soundscapeId: string, ownerUserId: string): string {
  // Auth ids are UUIDs and soundscape ids are opaque; anything outside the safe
  // set is dropped so a stem can never escape the folder or upset a filesystem.
  const safe = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '');
  return `${safe(ownerUserId)}-${safe(soundscapeId)}`;
}

function audioFile(soundscapeId: string, ownerUserId: string, url: string): File {
  return new File(rootDirectory(), `${fileStem(soundscapeId, ownerUserId)}${extensionFor(url, '.mp3')}`);
}

function artworkFile(soundscapeId: string, ownerUserId: string, url: string): File {
  return new File(
    artworkDirectory(),
    `${fileStem(soundscapeId, ownerUserId)}${extensionFor(url, '.jpg')}`
  );
}

function deleteQuietly(uri: string | null | undefined) {
  if (!uri || !isSupported) return;

  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    // A file we cannot remove is a leak, not a failure: the entry still goes.
    console.warn('[downloads] could not delete', uri, error);
  }
}

// ── Persistence ──────────────────────────────────────────────────────────────

function persist() {
  if (!isSupported) return;

  try {
    const file = new File(rootDirectory(), MANIFEST_NAME);
    if (!file.exists) file.create({ intermediates: true, overwrite: true });
    file.write(
      JSON.stringify({
        version: MANIFEST_VERSION,
        active_user_id: snapshot.activeUserId,
        entries: snapshot.entries,
      } as ManifestFile)
    );
  } catch (error) {
    console.warn('[downloads] manifest write failed', error);
  }
}

function fileHasBytes(uri: string): boolean {
  try {
    const file = new File(uri);
    return file.exists && (file.size ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * A file that is gone, or never finished, cannot be offered as playable.
 *
 * This is also where a manifest written before ownership existed is read: those
 * rows have no `owner_user_id`, and normalising the missing field to `null`
 * (rather than to the current user) is what keeps them hidden from everyone
 * instead of handing them to whoever signs in next.
 */
function reconcile(entries: LocalDownload[]): LocalDownload[] {
  return entries.map((raw) => {
    const entry: LocalDownload = {
      ...raw,
      owner_user_id: raw.owner_user_id ?? null,
      is_loop: raw.is_loop ?? true,
    };

    if (entry.status === 'completed') {
      if (entry.file_uri && fileHasBytes(entry.file_uri)) return entry;

      // The row survived but the file did not — offer the download again
      // rather than a track that cannot open.
      return { ...entry, status: 'failed', file_uri: null, progress_percent: 0 };
    }

    // Queued or downloading in the manifest means the app was killed mid
    // download. There is no resumable state to pick up, so offer a retry.
    if (entry.status !== 'failed') {
      return { ...entry, status: 'failed', file_uri: null, progress_percent: 0 };
    }

    return entry;
  });
}

let hydration: Promise<void> | null = null;

/**
 * Reads the manifest once per launch. Called from the root layout so the
 * Downloads tab, the player and the "Saved" chips are all correct on first
 * render, with or without a connection.
 */
export function hydrateLocalDownloads(): Promise<void> {
  if (snapshot.hydrated) return Promise.resolve();
  if (hydration) return hydration;

  hydration = (async () => {
    let entries: LocalDownload[] = [];
    let activeUserId: string | null = null;

    if (isSupported) {
      try {
        const file = new File(rootDirectory(), MANIFEST_NAME);
        if (file.exists) {
          const parsed = JSON.parse(await file.text()) as ManifestFile | null;
          entries = reconcile(Array.isArray(parsed?.entries) ? parsed.entries : []);
          activeUserId =
            typeof parsed?.active_user_id === 'string' && parsed.active_user_id
              ? parsed.active_user_id
              : null;
        }
      } catch (error) {
        // A corrupt manifest must not brick the tab; the files stay on disk and
        // a fresh download rebuilds the entry.
        console.warn('[downloads] manifest read failed', error);
        entries = [];
      }
    }

    // The pointer is what survives a launch, so an offline start still knows
    // whose downloads to show before `/api/me` could possibly answer.
    commit({ entries, activeUserId, hydrated: true });
    persist();
    hydration = null;
  })();

  return hydration;
}

// ── Mutations ────────────────────────────────────────────────────────────────

function writeEntry(next: LocalDownload, options: { persist?: boolean } = {}) {
  const index = snapshot.entries.findIndex(
    (entry) =>
      entry.soundscape_id === next.soundscape_id &&
      entry.owner_user_id === next.owner_user_id
  );

  commit({
    entries:
      index >= 0
        ? snapshot.entries.map((entry, position) => (position === index ? next : entry))
        : [next, ...snapshot.entries],
  });

  // Progress ticks are deliberately memory only — they arrive many times a
  // second, and a half written percentage is worth nothing after a restart.
  if (options.persist !== false) persist();
}

function patchEntry(
  soundscapeId: string,
  ownerUserId: string,
  patch: Partial<LocalDownload>,
  options: { persist?: boolean } = {}
) {
  const current = findEntry(soundscapeId, ownerUserId);
  if (!current) return;

  writeEntry({ ...current, ...patch, updated_at: new Date().toISOString() }, options);
}

function entryFor(
  soundscape: Soundscape,
  quality: 'standard' | 'high',
  ownerUserId: string
): LocalDownload {
  return {
    soundscape_id: soundscape.id,
    owner_user_id: ownerUserId,
    title: soundscape.title,
    short_title: soundscape.short_title ?? null,
    one_line_description: soundscape.one_line_description ?? null,
    mode: soundscape.mode ?? null,
    duration_seconds: soundscape.duration_seconds ?? null,
    is_loop: soundscape.is_loop ?? true,
    quality,
    file_url: soundscape.file_url?.trim() || null,
    file_uri: null,
    artwork_url: soundscape.artwork_url?.trim() || null,
    artwork_uri: null,
    file_size_bytes: 0,
    progress_percent: 0,
    status: 'queued',
    updated_at: new Date().toISOString(),
  };
}

/** Best effort: a missing cover costs a placeholder, not the download. */
async function saveArtwork(soundscape: Soundscape, ownerUserId: string): Promise<string | null> {
  const url = soundscape.artwork_url?.trim();
  // A row rebuilt from the manifest carries the cached `file://` cover; only a
  // remote URL is worth fetching.
  if (!url || !/^https?:\/\//i.test(url)) return null;

  try {
    const target = artworkFile(soundscape.id, ownerUserId, url);
    if (target.exists) target.delete();

    const saved = await File.downloadFileAsync(url, target, { idempotent: true });
    return saved.exists && (saved.size ?? 0) > 0 ? saved.uri : null;
  } catch (error) {
    console.warn('[downloads] artwork failed', soundscape.id, error);
    return null;
  }
}

export class DownloadUnsupportedError extends Error {}

/**
 * A download has to belong to somebody. Without an owner the file would land on
 * disk and then be invisible to every account, so this refuses up front rather
 * than leaving bytes nobody can reach.
 */
export class DownloadRequiresAccountError extends Error {
  constructor() {
    super('Sign in to save soundscapes for offline listening.');
  }
}

/**
 * Pulls the audio down and records it in the manifest.
 *
 * Nothing is marked `completed` until the file is on disk with a non-zero size,
 * so a caller that sees this resolve can honestly say the soundscape plays
 * offline. Every failure path leaves a `failed` entry the user can retry.
 */
export async function saveSoundscapeOffline(
  soundscape: Soundscape,
  options: { quality?: 'standard' | 'high' } = {}
): Promise<LocalDownload> {
  if (!isSupported) {
    throw new DownloadUnsupportedError('Downloads are only available in the app.');
  }

  const url = soundscape.file_url?.trim();
  if (!url) throw new Error('This soundscape has no audio file yet.');

  await hydrateLocalDownloads();

  const owner = getActiveDownloadUserId();
  if (!owner) throw new DownloadRequiresAccountError();

  const base = entryFor(soundscape, options.quality ?? 'standard', owner);
  writeEntry(base);

  try {
    const target = audioFile(soundscape.id, owner, url);
    // A retry must start clean: a resumable download appends to whatever it
    // finds, and a half written file would come back as a corrupt track.
    if (target.exists) target.delete();

    writeEntry({ ...base, status: 'downloading', updated_at: new Date().toISOString() });

    const resumable = createDownloadResumable(url, target.uri, {}, (progress) => {
      const expected = progress.totalBytesExpectedToWrite;
      // Held below 100 until the file is verified, so the UI never shows a
      // complete bar for something that has not landed yet.
      const percent =
        expected > 0
          ? Math.min(99, Math.round((progress.totalBytesWritten / expected) * 100))
          : 0;

      // The callback fires per chunk; redrawing the list only when the whole
      // number changes caps it at a hundred renders for the whole download.
      if (findEntry(soundscape.id, owner)?.progress_percent === percent) return;

      patchEntry(
        soundscape.id,
        owner,
        { progress_percent: percent, file_size_bytes: progress.totalBytesWritten },
        { persist: false }
      );
    });

    const result = await resumable.downloadAsync();

    // A 404 still writes a file — the error page — so the status decides.
    if (!result?.uri || result.status < 200 || result.status >= 300) {
      throw new Error(`Download failed with status ${result?.status ?? 'unknown'}.`);
    }

    const saved = new File(result.uri);
    if (!saved.exists || (saved.size ?? 0) <= 0) {
      throw new Error('The saved file is empty.');
    }

    const artworkUri = await saveArtwork(soundscape, owner);

    const completed: LocalDownload = {
      ...base,
      artwork_uri: artworkUri,
      file_uri: saved.uri,
      file_size_bytes: saved.size ?? 0,
      progress_percent: 100,
      status: 'completed',
      updated_at: new Date().toISOString(),
    };

    writeEntry(completed);
    return completed;
  } catch (error) {
    deleteQuietly(audioFile(soundscape.id, owner, url).uri);
    patchEntry(soundscape.id, owner, { status: 'failed', file_uri: null, progress_percent: 0 });
    throw error;
  }
}

/**
 * Removes one download — the active user's copy of it, and nothing else. A row
 * another account owns is not theirs to delete, so a mismatched id is a no-op
 * rather than a deletion.
 */
export async function removeLocalDownload(soundscapeId: string): Promise<void> {
  await hydrateLocalDownloads();

  const owner = getActiveDownloadUserId();
  if (!owner) return;

  const entry = findEntry(soundscapeId, owner);
  if (!entry) return;

  deleteQuietly(entry.file_uri);
  deleteQuietly(entry.artwork_uri);

  commit({
    entries: snapshot.entries.filter(
      (row) => !(row.soundscape_id === soundscapeId && row.owner_user_id === owner)
    ),
  });
  persist();
}

/**
 * Clears the active user's permanent downloads. The Saved tab and Download
 * Settings both promise this removes every saved soundscape from this device —
 * every one of *theirs*, which is the only set they can see.
 *
 * Deliberately file-by-file rather than deleting the folder: another account's
 * audio lives in the same directory, and emptying it would take their library
 * with it.
 */
export async function clearLocalDownloads(): Promise<void> {
  await hydrateLocalDownloads();

  const owner = getActiveDownloadUserId();
  if (!owner) return;

  const owned = snapshot.entries.filter((entry) => entry.owner_user_id === owner);
  for (const entry of owned) {
    deleteQuietly(entry.file_uri);
    deleteQuietly(entry.artwork_uri);
  }

  commit({
    entries: snapshot.entries.filter((entry) => entry.owner_user_id !== owner),
  });
  persist();
}

// ── Playback ─────────────────────────────────────────────────────────────────

/**
 * Enough of a `Soundscape` to play and to list, rebuilt from the manifest — the
 * offline path, where `GET /api/soundscapes/:id` is not an option.
 */
export function soundscapeFromLocalDownload(entry: LocalDownload): Soundscape {
  return {
    id: entry.soundscape_id,
    title: entry.title,
    short_title: entry.short_title,
    one_line_description: entry.one_line_description,
    artwork_url: entry.artwork_uri ?? entry.artwork_url,
    file_url: entry.file_url,
    mode: entry.mode,
    duration_seconds: entry.duration_seconds,
    is_loop: entry.is_loop ?? true,
    file_size_bytes: entry.file_size_bytes,
  };
}

/**
 * The same row with the remote artwork restored — what a retry needs, since a
 * cached `file://` cover cannot be downloaded again.
 */
export function remoteSourceFromLocalDownload(entry: LocalDownload): Soundscape {
  return { ...soundscapeFromLocalDownload(entry), artwork_url: entry.artwork_url };
}

// The player local source resolver is registered in lib/offline-audio.ts.

// ── Connection ───────────────────────────────────────────────────────────────

export type ConnectionType = 'wifi' | 'cellular' | 'unknown';

/** Maps Expo network state into the transport choices used by download policy. */
export type DownloadConnectivity = { type: ConnectionType; isOffline: boolean };

export async function getDownloadConnectivity(): Promise<DownloadConnectivity> {
  try {
    const state = await Network.getNetworkStateAsync();
    if (
      state.type === Network.NetworkStateType.NONE ||
      state.isConnected === false ||
      state.isInternetReachable === false
    ) {
      return { type: 'unknown', isOffline: true };
    }
    if (
      state.type === Network.NetworkStateType.WIFI ||
      state.type === Network.NetworkStateType.ETHERNET
    ) {
      return { type: 'wifi', isOffline: false };
    }
    if (state.type === Network.NetworkStateType.CELLULAR) {
      return { type: 'cellular', isOffline: false };
    }
    return { type: 'unknown', isOffline: false };
  } catch (error) {
    console.warn('[downloads] could not determine connection type', error);
    return { type: 'unknown', isOffline: false };
  }
}

export async function getConnectionType(): Promise<ConnectionType> {
  return (await getDownloadConnectivity()).type;
}
