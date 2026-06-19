import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const TOKEN_KEY = 'access_token';

export type DailyEase = {
  label: string;
  message: string;
  score: number;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
};

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

function getNumber(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }

  return null;
}

function getString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function normalizeDailyEase(response: unknown): DailyEase {
  const root = response && typeof response === 'object' ? (response as Record<string, unknown>) : {};
  const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : root;
  const nested = data.daily_ease && typeof data.daily_ease === 'object'
    ? (data.daily_ease as Record<string, unknown>)
    : data;
  const rawScore = getNumber(nested, ['score', 'value', 'daily_ease', 'dailyEase']) ?? 0;

  return {
    label: getString(nested, ['label', 'status', 'support_label', 'supportLabel']),
    message: getString(nested, ['message', 'summary', 'text', 'insight']),
    score: Math.max(0, Math.min(100, Math.round(rawScore))),
  };
}

export async function getDailyEase() {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Please login again to view Daily Ease.');
  }

  const response = await fetch(`${API_BASE_URL}/api/daily-ease`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  const data = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || data.success === false) {
    throw new Error(data.error ?? data.message ?? 'Unable to load Daily Ease.');
  }

  return normalizeDailyEase(data);
}
