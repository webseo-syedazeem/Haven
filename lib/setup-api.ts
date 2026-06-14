import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { apiClient } from '@/lib/api/client';

const SETUP_DRAFT_KEY = 'haven.setup.draft';

export type SetupMood = 'calm' | 'tense' | 'anxious' | 'overwhelmed';

export type SetupPayload = {
  mood: SetupMood;
  sleep_quality: string;
  day_feel: string;
  goal: string;
  time_preference: string;
  support_types: string[];
  stress_triggers?: string[];
};

export type SetupDraft = Partial<SetupPayload>;

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function readDraftText() {
  if (Platform.OS === 'web') {
    return getWebStorage()?.getItem(SETUP_DRAFT_KEY) ?? null;
  }

  return SecureStore.getItemAsync(SETUP_DRAFT_KEY);
}

async function writeDraftText(value: string | null) {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();

    if (!storage) {
      return;
    }

    if (value) {
      storage.setItem(SETUP_DRAFT_KEY, value);
    } else {
      storage.removeItem(SETUP_DRAFT_KEY);
    }

    return;
  }

  if (value) {
    await SecureStore.setItemAsync(SETUP_DRAFT_KEY, value);
  } else {
    await SecureStore.deleteItemAsync(SETUP_DRAFT_KEY);
  }
}

export async function getSetupDraft(): Promise<SetupDraft> {
  const text = await readDraftText();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as SetupDraft;
  } catch {
    return {};
  }
}

export async function updateSetupDraft(partial: SetupDraft) {
  const current = await getSetupDraft();
  const next = { ...current, ...partial };
  await writeDraftText(JSON.stringify(next));
  return next;
}

export function clearSetupDraft() {
  return writeDraftText(null);
}

export function getSetup() {
  return apiClient<any>('/api/setup');
}

export function saveSetup(payload: SetupPayload) {
  return apiClient<any>('/api/setup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateSetup(payload: SetupDraft) {
  return apiClient<any>('/api/setup', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function saveOrUpdateSetup(payload: SetupPayload) {
  try {
    await getSetup();
    return updateSetup(payload);
  } catch {
    return saveSetup(payload);
  }
}

export function toSetupMood(label: string): SetupMood {
  return label.toLowerCase() as SetupMood;
}

