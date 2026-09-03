import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ME_QUERY_KEY } from '@/hooks/useUser';
import { userApi } from '@/lib/api/user';
import { finishSessionRestore } from '@/lib/auth/session-state';
import { clearAuthTokens, refreshSession, setAccessToken, setAuthTokens } from '@/lib/haven-api';
import { queryClient } from '@/lib/query-client';

const ACCESS_TOKEN_KEY = 'access_token';
const LEGACY_ACCESS_TOKEN_KEY = 'haven.auth.access_token';
const REFRESH_TOKEN_KEY = 'haven.auth.refresh_token';

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

let restorePromise: Promise<boolean> | null = null;

/**
 * Reads the tokens kept in secure storage once per launch and validates them.
 * Resolves to `true` when a usable session was restored, meaning the app can go
 * straight to the tabs. Until it settles no authenticated query runs, so a fresh
 * install never calls `/api/me` and a stale token is refreshed quietly instead
 * of surfacing an auth error.
 */
export function restoreSession() {
  restorePromise ??= runRestore();
  return restorePromise;
}

async function runRestore(): Promise<boolean> {
  try {
    const accessToken =
      (await getStoredItem(ACCESS_TOKEN_KEY)) ?? (await getStoredItem(LEGACY_ACCESS_TOKEN_KEY));
    const refreshToken = await getStoredItem(REFRESH_TOKEN_KEY);

    if (!accessToken) {
      return false;
    }

    setAccessToken(accessToken);
    if (refreshToken) {
      setAuthTokens({ refreshToken });
    }

    try {
      // Primes the cache so the `useUser` query does not refetch straight after.
      queryClient.setQueryData(ME_QUERY_KEY, await userApi.get());
      return true;
    } catch {
      // Stored access token is no longer accepted, try the refresh token below.
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
          return true;
        }
      } catch {
        // Refresh failed, fall through and drop the session.
      }
    }

    clearAuthTokens();
    queryClient.removeQueries({ queryKey: ME_QUERY_KEY });
    await Promise.all([
      deleteStoredItem(ACCESS_TOKEN_KEY),
      deleteStoredItem(LEGACY_ACCESS_TOKEN_KEY),
      deleteStoredItem(REFRESH_TOKEN_KEY),
    ]);

    return false;
  } catch {
    return false;
  } finally {
    finishSessionRestore();
  }
}
