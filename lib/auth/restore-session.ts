import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { isAuthFailure, isNetworkError } from '@/lib/api/errors';
import { userApi } from '@/lib/api/user';
import {
  cacheProfile,
  markLoggedIn,
  markLoggedOut,
  readCachedProfile,
  wasLoggedIn,
} from '@/lib/auth/offline-session';
import {
  finishSessionRestore,
  hydrateGuestMode,
  isGuestModeActive,
} from '@/lib/auth/session-state';
import { clearAuthTokens, refreshSession, setAccessToken, setAuthTokens } from '@/lib/passage-api';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

const ACCESS_TOKEN_KEY = 'passage.auth.access_token';
const REFRESH_TOKEN_KEY = 'passage.auth.refresh_token';
const LEGACY_ACCESS_TOKEN_KEYS = ['access_token'] as const;

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function getStoredItem(key: string) {
  if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setStoredItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteStoredItem(key: string) {
  if (Platform.OS === 'web') {
    getWebStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

/**
 * How the launch time restore ended.
 *
 * `offline` is the one that matters: the stored session could not be checked
 * because nothing answered, so it is treated as still valid. Only `signed-out`
 * sends the user to the sign-in screen.
 */
export type SessionRestoreStatus = 'restored' | 'offline' | 'signed-out';

let restorePromise: Promise<SessionRestoreStatus> | null = null;

/**
 * Reads the tokens kept in secure storage once per launch and validates them.
 *
 * The rule the whole offline launch rests on: a session is only ever dropped
 * when a *reachable* server rejects it. A failed request with no HTTP response
 * behind it - airplane mode, no signal, a timeout - leaves the tokens, the
 * cached profile and the durable flag exactly where they are, and the app opens
 * as normal. Until this settles no authenticated query runs, so a fresh install
 * never calls `/api/me` and a stale token is refreshed quietly.
 */
export function restoreSession() {
  restorePromise ??= runRestore();
  return restorePromise;
}

/**
 * Nothing answered, so nothing can be concluded about the session. The tokens
 * stay put and the user goes into the app if this device was ever signed in.
 *
 * `wasLoggedIn()` returns `null` on an install that predates the flag; the
 * stored access token that got us here is evidence enough, so unknown is
 * treated as signed in rather than tipping an existing user out.
 */
async function offlineOutcome(): Promise<SessionRestoreStatus> {
  return (await wasLoggedIn()) === false ? 'signed-out' : 'offline';
}

async function runRestore(): Promise<SessionRestoreStatus> {
  try {
    // Before anything else: a device that left off in guest mode must stay
    // gated from authenticated queries for this launch too, not just for the
    // session that set the flag.
    await hydrateGuestMode();

    // Guest mode is an explicit durable choice. Do not inspect, validate or
    // refresh any account token while it is active; launch goes straight to
    // the public app and every token-only query stays disabled.
    if (isGuestModeActive()) return 'signed-out';

    let accessToken = await getStoredItem(ACCESS_TOKEN_KEY);
    if (!accessToken) {
      for (const key of LEGACY_ACCESS_TOKEN_KEYS) {
        accessToken = await getStoredItem(key);
        if (accessToken) break;
      }
      if (accessToken) await setStoredItem(ACCESS_TOKEN_KEY, accessToken);
    }
    const refreshToken = await getStoredItem(REFRESH_TOKEN_KEY);

    // Seed the cache before anything is validated, so an offline launch has a
    // name and an avatar to draw the moment the tabs mount.
    const cached = await readCachedProfile();
    if (cached) {
      queryClient.setQueryData(ME_QUERY_KEY, cached);
    }

    if (!accessToken) {
      // Google/Apple/email-confirm sessions live only in the Supabase client,
      // not in the Passage SecureStore keys. supabase-js has already restored
      // (and, if expired, refreshed) that session from its own storage by now,
      // so validate it the same way — `userApi.get` reads the live Supabase
      // token through `apiClient`. Without this, those users were sent to the
      // login screen on every cold start (audit C-1).
      const { data: supabaseSession } = await supabase.auth.getSession();
      if (supabaseSession.session?.access_token) {
        try {
          const me = await userApi.get();
          queryClient.setQueryData(ME_QUERY_KEY, me);
          await cacheProfile(me);
          await markLoggedIn();
          return 'restored';
        } catch (error) {
          if (isNetworkError(error) || !isAuthFailure(error)) return offlineOutcome();
          // A reachable server rejected the Supabase session: it is genuinely over.
          try {
            await supabase.auth.signOut();
          } catch {
            // Best effort — the markLoggedOut below is what gates the next launch.
          }
        }
      }
      await markLoggedOut();
      return 'signed-out';
    }

    setAccessToken(accessToken);
    if (refreshToken) {
      setAuthTokens({ refreshToken });
    }

    try {
      // Primes the cache so the `useUser` query does not refetch straight after.
      const me = await userApi.get();
      queryClient.setQueryData(ME_QUERY_KEY, me);
      await cacheProfile(me);
      await markLoggedIn();
      return 'restored';
    } catch (error) {
      if (isNetworkError(error) || !isAuthFailure(error)) return offlineOutcome();
      // The server specifically rejected the stored credentials, so try the
      // refresh token below. A 429/5xx must never sign out a valid session.
    }

    if (refreshToken) {
      try {
        const response = (await refreshSession(refreshToken)) as any;
        const session = response?.data?.session ?? response;
        const nextAccessToken = session?.access_token ?? session?.accessToken ?? session?.token;
        const nextRefreshToken = session?.refresh_token ?? session?.refreshToken;

        if (nextAccessToken) {
          await setStoredItem(ACCESS_TOKEN_KEY, nextAccessToken);
          if (nextRefreshToken) {
            await setStoredItem(REFRESH_TOKEN_KEY, nextRefreshToken);
          }
          setAccessToken(nextAccessToken);
          const me = await userApi.get();
          queryClient.setQueryData(ME_QUERY_KEY, me);
          await cacheProfile(me);
          await markLoggedIn();
          return 'restored';
        }
      } catch (error) {
        if (isNetworkError(error) || !isAuthFailure(error)) return offlineOutcome();
        // Refresh was refused by a server that answered, so the session is
        // genuinely over. Fall through and drop it.
      }
    }

    clearAuthTokens();
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    // A reachable server refused the credentials, so this is a sign out in
    // everything but name.
    await markLoggedOut();
    await Promise.all([
      deleteStoredItem(ACCESS_TOKEN_KEY),
      ...LEGACY_ACCESS_TOKEN_KEYS.map((key) => deleteStoredItem(key)),
      deleteStoredItem(REFRESH_TOKEN_KEY),
    ]);

    return 'signed-out';
  } catch {
    // Reading storage itself failed. Nothing was rejected, so an install that
    // was signed in stays signed in.
    return offlineOutcome();
  } finally {
    finishSessionRestore();
  }
}
