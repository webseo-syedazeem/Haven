import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://18.171.253.186';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const TOKEN_KEY = 'access_token';

export type MoodRecord = {
  created_at?: string;
  createdAt?: string;
  date?: string;
  id?: number | string;
  mood?: string;
  updated_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
};

export class MoodAuthError extends Error {
  constructor(message = 'Session expired. Please login again.') {
    super(message);
    this.name = 'MoodAuthError';
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

async function moodRequest<T>(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();

  if (!token) {
    throw new MoodAuthError();
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });
  const data = (await response.json()) as ApiResponse<T>;

  if (response.status === 401) {
    await clearAccessToken();
    throw new MoodAuthError();
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error ?? data.message ?? 'Mood request failed.');
  }

  return data.data as T;
}

function unwrapMoodList(data: unknown): MoodRecord[] {
  if (!data || typeof data !== 'object') {
    return [];
  }

  if (Array.isArray(data)) {
    return data as MoodRecord[];
  }

  const record = data as Record<string, unknown>;
  const moods = record.moods ?? record.moodHistory ?? record.history;
  return Array.isArray(moods) ? (moods as MoodRecord[]) : [];
}

function unwrapMood(data: unknown): MoodRecord | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;
  const mood = record.mood ?? record.latestMood ?? record.latest;

  if (mood && typeof mood === 'object') {
    return mood as MoodRecord;
  }

  return record as MoodRecord;
}

export async function getMoods() {
  return unwrapMoodList(await moodRequest<unknown>('/api/mood'));
}

export async function getLatestMood() {
  return unwrapMood(await moodRequest<unknown>('/api/mood/latest'));
}

export async function createMood(mood: string) {
  return unwrapMood(
    await moodRequest<unknown>('/api/mood', {
      body: JSON.stringify({ mood }),
      method: 'POST',
    })
  );
}

export async function createMoodWithFallbacks(mood: string) {
  const fallbackMoods =
    mood === 'Stressed'
      ? ['Stressed', 'Stress', 'Tense']
      : mood === 'Peace'
        ? ['Peace', 'Calm']
        : [mood];
  let lastError: unknown;

  for (const nextMood of fallbackMoods) {
    try {
      return await createMood(nextMood);
    } catch (error) {
      lastError = error;

      if (
        error instanceof MoodAuthError ||
        !(error instanceof Error) ||
        !error.message.toLowerCase().includes('invalid mood')
      ) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to save mood.');
}

export async function updateMood(id: number | string, mood: string) {
  return unwrapMood(
    await moodRequest<unknown>(`/api/mood/${id}`, {
      body: JSON.stringify({ mood }),
      method: 'PUT',
    })
  );
}
