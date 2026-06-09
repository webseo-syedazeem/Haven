import { getAccessToken } from '@/lib/haven-api';
import { supabase } from '@/lib/supabase';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const TOKEN_KEY = 'haven.auth.access_token';

export async function apiClient<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. Memory se try karo
  let token = getAccessToken();

  // 2. SecureStore se try karo
  if (!token) {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  }

  // 3. Supabase session se try karo
  if (!token) {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token ?? null;
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    }
  }
console.log('TOKEN:', token ? token.substring(0, 40) + '...' : 'NULL');
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
