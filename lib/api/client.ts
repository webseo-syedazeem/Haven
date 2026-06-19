import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';
import { getAccessToken } from '@/lib/haven-api';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Request failed');
  return data;
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

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error ?? 'Request failed');
  return data;
}
