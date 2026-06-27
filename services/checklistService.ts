import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const REMOTE_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://thehappyapp.co.uk';
const API_BASE_URL = Platform.OS === 'web' ? '/api-proxy' : REMOTE_API_BASE_URL;
const TOKEN_KEY = 'access_token';

export class ChecklistAuthError extends Error {
  constructor(message = 'Session expired. Please login again.') {
    super(message);
    this.name = 'ChecklistAuthError';
  }
}

export type ChecklistRecord = {
  date?: string;
  id?: number | string;
  percentage?: number;
  tasks?: unknown[];
  [key: string]: unknown;
};

export type ChecklistHistoryItem = {
  date: string;
  percentage: number;
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

async function clearAccessToken() {
  if (Platform.OS === 'web') {
    (globalThis as unknown as { localStorage?: Storage }).localStorage?.removeItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

async function checklistRequest<T>(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error('Please login again before saving your checklist.');
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
    throw new ChecklistAuthError();
  }

  if (!response.ok || data.success === false) {
    throw new Error(data.error ?? data.message ?? 'Checklist request failed.');
  }

  return data.data as T;
}

export async function getTodayChecklist() {
  const data = await checklistRequest<{ checklist?: ChecklistRecord | null }>('/api/checklist/today');
  return data?.checklist ?? null;
}

export async function getChecklistHistory() {
  const data = await checklistRequest<{ checklists?: ChecklistHistoryItem[] }>('/api/checklist');
  return data?.checklists ?? [];
}

export async function toggleChecklistTask(taskName: string, completed: boolean) {
  return checklistRequest<{ checklist?: ChecklistRecord }>('/api/checklist/task', {
    body: JSON.stringify({ completed, task: taskName }),
    method: 'PATCH',
  });
}
