import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { MeApiResponse } from '@/lib/api/user';
import { setGuestModeActive } from '@/lib/auth/session-state';

/**
 * What the app knows about the signed-in user without asking the server.
 *
 * Two things live here, both deliberately non-secret:
 *
 * - `isLogged` - the durable gate that lets a launch with no connectivity go
 *   straight into the app instead of to the sign-in screen. Set only on a
 *   confirmed sign in or session restore, cleared only on an explicit logout or
 *   a rejection from a reachable server. A network failure never touches it.
 * - `profile` - the last successful `/api/me` response, including
 *   `onboarding_completed`, so launch can make the offline exception without
 *   waiting on a request that cannot finish.
 *
 * The id is read inline rather than imported from `lib/api/user` because that
 * module reaches back to `lib/passage-api`, which imports this one.
 *
 * Tokens are NOT here and never will be: they stay in SecureStore, which is
 * what `lib/passage-api.ts` and `lib/api/client.ts` already use. This file holds
 * only what is safe to keep in the clear.
 *
 * Storage is a small JSON file in the app-private document directory, with
 * `localStorage` standing in on web.
 * AsyncStorage would have been the conventional home for this, but it is not a
 * dependency of this project and adding a native module would force a new dev
 * client build; a file in the app's own sandbox is equally durable and needs
 * nothing new.
 */

const FILE_NAME = 'session.json';
const WEB_STORAGE_KEY = 'passage.session';

type OfflineSession = {
  /** `undefined` on an install from before this file existed - see `wasLoggedIn`. */
  isLogged?: boolean;
  profile?: MeApiResponse | null;
  updatedAt?: string;
};

let cache: OfflineSession | null = null;

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

function sessionFile(): File {
  // `Paths.document` is the app's private sandbox on both platforms and is not
  // purged the way the cache directory is.
  const directory = new Directory(Paths.document);
  return new File(directory, FILE_NAME);
}

async function read(): Promise<OfflineSession> {
  if (cache) return cache;

  try {
    if (Platform.OS === 'web') {
      const raw = getWebStorage()?.getItem(WEB_STORAGE_KEY);
      cache = raw ? (JSON.parse(raw) as OfflineSession) : {};
    } else {
      const file = sessionFile();
      cache = file.exists ? ((JSON.parse(await file.text()) as OfflineSession) ?? {}) : {};
    }
  } catch {
    // A corrupt or unreadable file must not stop the app launching; the worst
    // case is one trip through the sign-in screen.
    cache = {};
  }

  return cache;
}

async function write(next: OfflineSession): Promise<void> {
  cache = next;

  try {
    const raw = JSON.stringify(next);

    if (Platform.OS === 'web') {
      getWebStorage()?.setItem(WEB_STORAGE_KEY, raw);
      return;
    }

    const file = sessionFile();
    if (!file.exists) file.create({ intermediates: true, overwrite: true });
    file.write(raw);
  } catch (error) {
    console.warn('[session] could not persist the offline session', error);
  }
}

async function patch(changes: Partial<OfflineSession>): Promise<void> {
  await write({ ...(await read()), ...changes, updatedAt: new Date().toISOString() });
}

/**
 * `true` / `false` once the flag has been written, `null` on an install that
 * predates it. A `null` means "unknown", not "logged out" - the caller decides
 * what to trust instead, which is what keeps existing users signed in across
 * this change.
 */
export async function wasLoggedIn(): Promise<boolean | null> {
  const session = await read();
  return typeof session.isLogged === 'boolean' ? session.isLogged : null;
}

/** Called after every confirmed sign in, sign up, refresh and session restore. */
export async function markLoggedIn(): Promise<void> {
  // A real session now exists — an earlier "Continue as guest" on this
  // device must not keep gating authenticated queries.
  await setGuestModeActive(false);
  await patch({ isLogged: true });
}

/**
 * Called on an explicit logout, and when a reachable server rejects the stored
 * credentials. Never called for a network failure.
 */
export async function markLoggedOut(): Promise<void> {
  await write({ isLogged: false, profile: null, updatedAt: new Date().toISOString() });
}

export async function cacheProfile(profile: MeApiResponse): Promise<void> {
  await patch({ profile });
}

export async function readCachedProfile(): Promise<MeApiResponse | null> {
  return (await read()).profile ?? null;
}

export async function readCachedOnboardingCompleted(): Promise<boolean | null> {
  const completed = (await read()).profile?.data?.profile?.onboarding_completed;
  return typeof completed === 'boolean' ? completed : null;
}
