import { ApiError, NetworkError, isAuthFailure, isNetworkError } from '@/lib/api/errors';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { isGuestModeActive, setSessionSource } from '@/lib/auth/session-state';
import { markLoggedOut } from '@/lib/auth/offline-session';
import { clearAuthTokens, getAccessToken, getRefreshToken, refreshSession } from '@/lib/haven-api';
import { Platform } from 'react-native';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://thehappyapp.co.uk';
export const AUTH_TOKEN_KEY = 'haven.auth.access_token';
const LEGACY_AUTH_TOKEN_KEY = 'access_token';
const RATE_LIMIT_MAX_RETRIES = 2;
const RATE_LIMIT_FALLBACK_DELAYS_MS = [1_000, 2_000] as const;
/** A long server window must not leave a screen apparently hung for minutes. */
const RATE_LIMIT_MAX_DELAY_MS = 10_000;

const TOKEN_REQUIRED_PATH_PREFIXES = [
  '/api/me',
  '/api/update-name',
  '/api/change-password',
  '/api/upload-profile-image',
  '/api/remove-profile-image',
  '/api/favourites',
  '/api/play-history',
  '/api/home/continue-listening',
  '/api/home/recommended',
  '/api/player/state',
  '/api/playlists',
  '/api/preferences',
  '/api/account',
  '/api/onboarding',
  '/api/notifications',
  '/api/support/my-requests',
] as const;

function assertGuestMayCall(path: string): void {
  if (
    isGuestModeActive() &&
    TOKEN_REQUIRED_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)
    )
  ) {
    throw new Error('Please log in to use this account feature.');
  }
}

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function getStoredItem(key: string) {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(key) ?? null;
  }

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

async function getStoredToken() {
  return (
    getAccessToken() ||
    (await getStoredItem(LEGACY_AUTH_TOKEN_KEY)) ||
    (await getStoredItem(AUTH_TOKEN_KEY))
  );
}

export async function clearStoredAccessToken() {
  setSessionSource('haven', false);

  await Promise.all([
    deleteStoredItem(AUTH_TOKEN_KEY),
    deleteStoredItem(LEGACY_AUTH_TOKEN_KEY),
  ]);
}

let signOutInFlight: Promise<void> | null = null;

/**
 * Drops both session sources at once (see lib/auth/session-state.ts): the
 * Haven tokens and the Supabase session that Google/Apple/email-confirm
 * sign-ins also mark active. Clearing only one used to leave
 * `hasActiveSession()` stuck true forever with no token anywhere left to
 * send — every gated query kept firing and kept 401ing.
 */
async function forceSignOutStaleSession(): Promise<void> {
  signOutInFlight ??= (async () => {
    clearAuthTokens();
    await markLoggedOut();
    try {
      await supabase.auth.signOut();
    } catch {
      // Best effort — the Haven-side clear above is what actually matters.
    }
  })();

  try {
    await signOutInFlight;
  } finally {
    signOutInFlight = null;
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/**
 * The access token is only ever refreshed at launch (`restoreSession`)
 * otherwise, so a token that expires mid-session used to fail forever. A 401
 * on a request that actually carried a token now runs this once — concurrent
 * 401s share the one attempt — and callers retry with the result.
 *
 * Returns the new token, or null if there is nothing to retry with (no
 * refresh token, offline, or the server has genuinely refused the session —
 * that last case also drops the session, see `forceSignOutStaleSession`).
 */
async function refreshAccessToken(): Promise<string | null> {
  refreshInFlight ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      await forceSignOutStaleSession();
      return null;
    }

    try {
      await refreshSession(refreshToken);
      return getAccessToken();
    } catch (error) {
      if (isNetworkError(error) || !isAuthFailure(error)) return null;
      // The server specifically refused the refresh token: the session is over.
      // Rate limits and transient server errors must leave the session intact.
      await forceSignOutStaleSession();
      return null;
    }
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

async function send(path: string, options: RequestInit, token: string | null): Promise<Response> {
  const { body, headers: optionHeaders, ...fetchOptions } = options;
  const hasBody = body !== undefined && body !== null;

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      ...(hasBody ? { body } : {}),
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((optionHeaders as Record<string, string>) ?? {}),
      },
    });
  } catch (error) {
    // Nobody answered. This says nothing about the session, so it is raised as
    // a distinct type the launch path can tell apart from a rejection.
    throw new NetworkError('Could not reach the server.', { cause: error });
  }
}

function retryAfterMs(response: Response, retryIndex: number): number {
  const value = response.headers.get('Retry-After')?.trim();
  let requestedDelay: number | null = null;

  if (value) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds >= 0) {
      requestedDelay = seconds * 1_000;
    } else {
      const retryAt = Date.parse(value);
      if (Number.isFinite(retryAt)) requestedDelay = Math.max(0, retryAt - Date.now());
    }
  }

  return Math.min(
    requestedDelay ?? RATE_LIMIT_FALLBACK_DELAYS_MS[retryIndex],
    RATE_LIMIT_MAX_DELAY_MS
  );
}

function waitForRetry(delayMs: number, signal?: AbortSignal | null): Promise<void> {
  if (signal?.aborted) {
    return Promise.reject(
      new NetworkError('Request was cancelled.', { cause: signal.reason })
    );
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(new NetworkError('Request was cancelled.', { cause: signal?.reason }));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, delayMs);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * A launch can legitimately fan out several independent queries. If they land
 * at the end of the backend's fixed window, retry a 429 twice with bounded
 * backoff instead of immediately turning it into a visible query error.
 */
async function sendWithRateLimitRetry(
  request: () => Promise<Response>,
  signal?: AbortSignal | null
): Promise<Response> {
  for (let retryIndex = 0; ; retryIndex += 1) {
    const response = await request();
    if (response.status !== 429 || retryIndex >= RATE_LIMIT_MAX_RETRIES) return response;

    await waitForRetry(retryAfterMs(response, retryIndex), signal);
  }
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Defense in depth: UI queries/actions are gated too, but an accidental
  // manual refetch or deep link still must not put a token-only request on the
  // wire while the explicit guest flag is active.
  assertGuestMayCall(path);
  let token = await getStoredToken();

  // 2. SecureStore se try karo
  if (!token) {
    token = await getStoredItem(LEGACY_AUTH_TOKEN_KEY);
  }

  // 3. Supabase session se try karo
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
    if (token) {
      await setStoredItem(LEGACY_AUTH_TOKEN_KEY, token);
    }
  }

  const res = await sendWithRateLimitRetry(
    () => send(path, options, token),
    options.signal
  );

  try {
    return await readEnvelope<T>(res);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (token) {
        const freshToken = await refreshAccessToken();
        if (freshToken) {
          return readEnvelope<T>(
            await sendWithRateLimitRetry(
              () => send(path, options, freshToken),
              options.signal
            )
          );
        }
      } else {
        // Nothing was even sent, yet this call only fires when the app
        // believes it has a session (`hasActiveSession()`) — the session-
        // source flags are desynced from reality. Correct them so the next
        // render stops treating this as signed in.
        await forceSignOutStaleSession();
      }
    }
    throw error;
  }
}

/**
 * For endpoints that must work before an account exists. Unlike `apiClient` it
 * never looks up or sends a token, so a stale session cannot leak into (or
 * sign out because of) a guest request.
 */
export async function publicApiClient<T>(path: string, options: RequestInit = {}): Promise<T> {
  return readEnvelope<T>(
    await sendWithRateLimitRetry(
      () => send(path, options, null),
      options.signal
    )
  );
}

/**
 * Every failure carries the HTTP status, so callers can tell "your token is no
 * longer valid" (401) from "the request was refused" (anything else).
 */
async function readEnvelope<T>(res: Response): Promise<T> {
  let data: { success?: boolean; error?: string } | null = null;

  try {
    data = await res.json();
  } catch {
    // A gateway error page is not JSON; the status below still describes it.
    data = null;
  }

  if (res.status === 503) {
    const statusBridge = globalThis as typeof globalThis & {
      __passageSetServiceUnavailable?: (value: boolean) => void;
    };
    statusBridge.__passageSetServiceUnavailable?.(true);
  }
  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed with status ${res.status}`, res.status, data);
  }

  if (!data?.success) {
    throw new ApiError(data?.error ?? 'Request failed', res.status, data);
  }

  return data as T;
}

export async function apiClientFormData<T>(
  path: string,
  formData: FormData,
  method = 'POST'
): Promise<T> {
  assertGuestMayCall(path);
  let token = getAccessToken();

  if (!token) {
    token = await getStoredItem(LEGACY_AUTH_TOKEN_KEY);
  }

  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
    if (token) {
      await setStoredItem(LEGACY_AUTH_TOKEN_KEY, token);
    }
  }

  const sendForm = async (bearer: string | null): Promise<Response> => {
    try {
      return await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: formData,
      });
    } catch (error) {
      throw new NetworkError('Could not reach the server.', { cause: error });
    }
  };

  const res = await sendWithRateLimitRetry(() => sendForm(token));

  try {
    return await readEnvelope<T>(res);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (token) {
        const freshToken = await refreshAccessToken();
        if (freshToken) {
          return readEnvelope<T>(
            await sendWithRateLimitRetry(() => sendForm(freshToken))
          );
        }
      } else {
        await forceSignOutStaleSession();
      }
    }
    throw error;
  }
}
