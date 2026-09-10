import { ApiError, NetworkError } from '@/lib/api/errors';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { setSessionSource } from '@/lib/auth/session-state';
import { getAccessToken } from '@/lib/haven-api';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://thehappyapp.co.uk';
export const AUTH_TOKEN_KEY = 'haven.auth.access_token';
const LEGACY_AUTH_TOKEN_KEY = 'access_token';

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

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
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
  const { body, headers: optionHeaders, ...fetchOptions } = options;
  const hasBody = body !== undefined && body !== null;

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
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

  return readEnvelope<T>(res);
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

  let res: Response;

  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
  } catch (error) {
    throw new NetworkError('Could not reach the server.', { cause: error });
  }

  return readEnvelope<T>(res);
}
