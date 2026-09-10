import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Persists the TanStack Query cache to disk so a launch with no connection
 * renders the last good version of every screen instead of a spinner and an
 * error.
 *
 * Backed by a file in the app-private document directory rather than
 * AsyncStorage: AsyncStorage is not a dependency of this project and adding it
 * would force a new dev client build, while a file in the sandbox is just as
 * durable, is not purged the way the cache directory is, and needs nothing new.
 * `localStorage` stands in on web.
 */

const CACHE_FILE_NAME = 'query-cache.json';
const WEB_STORAGE_KEY = 'passage.query-cache';

/** A day is long enough to cover a commute or a flight without serving stale news. */
const MAX_AGE_MS = 1000 * 60 * 60 * 24;

/**
 * Query key roots worth keeping on disk: the read-heavy catalogue screens and
 * the profile. Everything else — downloads (which have their own manifest),
 * mutations, one-off lookups — is left out so the file stays small and nothing
 * device-specific is restored from a stale snapshot.
 */
const PERSISTED_KEY_ROOTS = new Set([
  'home', // continue-listening, recommended, play-history, favourites, new, short sessions, popular collections
  'soundscape', // soundscape detail
  'soundscapes', // by mode, similar
  'explore',
  'collection',
  'library', // library results, search, suggestions
  'play-history',
  'preferences',
  'me',
]);

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

function cacheFile(): File {
  return new File(new Directory(Paths.document), CACHE_FILE_NAME);
}

/**
 * The `{ getItem, setItem, removeItem }` shape the persister expects. Every
 * method swallows its errors: a cache that cannot be read or written must never
 * be what stops the app starting.
 */
const fileStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null;

      const file = cacheFile();
      return file.exists ? await file.text() : null;
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    // A logout wipe has to win against a save that was already in flight. The
    // persister throttles its writes, so the snapshot handed to a pending
    // trailing call was dehydrated *before* the cache was cleared and would put
    // the previous user's rails straight back on disk. Dropping writes for
    // slightly longer than the throttle window closes that race; the next cache
    // event after it re-persists whatever the new session has by then.
    if (Date.now() < writesBlockedUntil) return;

    try {
      if (Platform.OS === 'web') {
        getWebStorage()?.setItem(key, value);
        return;
      }

      const file = cacheFile();
      if (!file.exists) file.create({ intermediates: true, overwrite: true });
      file.write(value);
    } catch (error) {
      console.warn('[query-cache] could not persist', error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        getWebStorage()?.removeItem(key);
        return;
      }

      const file = cacheFile();
      if (file.exists) file.delete();
    } catch {
      // Nothing to do: the next write overwrites it anyway.
    }
  },
};

const THROTTLE_MS = 1000;

/** See `fileStorage.setItem` — the guard window opened by `clearPersistedQueryCache`. */
let writesBlockedUntil = 0;

const persister = createAsyncStoragePersister({
  key: WEB_STORAGE_KEY,
  storage: fileStorage,
  // Rails settle in bursts as their queries land; one write a second is plenty.
  throttleTime: THROTTLE_MS,
});

/**
 * Deletes the cache from disk. Called on logout, where `queryClient.clear()`
 * only empties memory: the file it was written to would otherwise still be
 * sitting there, and the next launch — or the next person to use the phone —
 * would hydrate the previous user's Home rails, favourites and profile out of
 * it before any fresh request could land.
 *
 * `removeClient()` is the persister's own API for this, so the stored blob goes
 * by the same route it arrived by, key and all.
 */
export async function clearPersistedQueryCache(): Promise<void> {
  writesBlockedUntil = Date.now() + THROTTLE_MS * 2;

  try {
    await persister.removeClient();
  } catch (error) {
    // Best effort by design: an unremovable file must not leave the user
    // half signed out. The in-memory cache is already gone either way.
    console.warn('[query-cache] could not remove the persisted cache', error);
  }
}

/**
 * The app version busts the cache, so a build that changes a response shape
 * starts from a clean slate instead of hydrating data it can no longer read.
 */
const buster = Constants.expoConfig?.version ?? 'dev';

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: MAX_AGE_MS,
  buster,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only successful reads are worth restoring; a persisted error would show
      // the user a failure that already resolved.
      if (query.state.status !== 'success') return false;

      const root = query.queryKey[0];
      return typeof root === 'string' && PERSISTED_KEY_ROOTS.has(root);
    },
  },
};
