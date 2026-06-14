import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const TOKEN_KEY = 'access_token';
const LEGACY_TOKEN_KEY = 'haven.auth.access_token';

function getWebToken() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage;
  return storage?.getItem(TOKEN_KEY) ?? null;
}

async function getStoredToken() {
  if (Platform.OS === 'web') {
    return getWebToken();
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function saveStoredToken(token: string) {
  if (Platform.OS === 'web') {
    const storage = typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { localStorage?: Storage }).localStorage
      : undefined;
    storage?.setItem(TOKEN_KEY, token);
    storage?.removeItem(LEGACY_TOKEN_KEY);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

function getShortTokenLog(token: string | null | undefined) {
  return token ? `${token.slice(0, 10)}...` : 'missing';
}

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = await getStoredToken();

  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
    if (token) {
      await saveStoredToken(token);
    }
  }

  console.log('API token exists:', Boolean(token), getShortTokenLog(token));

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  if (__DEV__) {
    console.log(`API: ${options.method || 'GET'} ${API_BASE_URL}${path} → ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Request failed');
  return data;
}
