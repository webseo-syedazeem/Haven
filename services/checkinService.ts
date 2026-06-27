import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://thehappyapp.co.uk';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const TOKEN_KEY = 'access_token';

export type CreateCheckinPayload = {
  helpful_today: string[];
  reflection: string;
  stress_factors: string[];
  stress_level: number;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
};

export class CheckinAuthError extends Error {
  constructor(message = 'Session expired. Please login again.') {
    super(message);
    this.name = 'CheckinAuthError';
  }
}

function getWebToken() {
  if (typeof globalThis === 'undefined') {
    return null;
  }

  return (globalThis as unknown as { localStorage?: Storage }).localStorage?.getItem(TOKEN_KEY) ?? null;
}

async function getAccessToken() {
  if (Platform.OS === 'web') {
    return getWebToken();
  }

  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function clearAccessToken() {
  if (Platform.OS === 'web') {
    (globalThis as unknown as { localStorage?: Storage }).localStorage?.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function createCheckin(payload: CreateCheckinPayload) {
  const token = await getAccessToken();

  if (!token) {
    throw new CheckinAuthError();
  }

  const response = await fetch(`${API_BASE_URL}/api/checkin`, {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });
  const data = (await response.json().catch(() => ({}))) as ApiResponse<unknown>;

  if (response.status === 401) {
    await clearAccessToken();
    throw new CheckinAuthError();
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error ?? data.message ?? 'Unable to save your check-in.');
  }

  return data.data ?? data;
}
