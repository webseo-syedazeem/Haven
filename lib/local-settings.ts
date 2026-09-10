import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small key/value store for preferences the backend has no column for.
 *
 * Everything here is device-local and never leaves the phone. It exists for two
 * settings the API cannot hold today:
 *
 * - `analytics_opt_out` — there is no analytics preference on the server
 *   (`/api/analytics/events` only accepts events), so the user's choice is kept
 *   here and every client side analytics call is gated on it.
 * - `reminder_time` — `user_notification_settings` stores `reminders_enabled`
 *   but no time, so the chosen hour lives here and drives the locally
 *   scheduled reminder.
 *
 * Storage mirrors `lib/api/client.ts`: SecureStore on device, localStorage on
 * web. Reads never throw — a missing or corrupt value falls back to the
 * default the caller passed.
 */

const KEY_PREFIX = 'halcyon.settings.';

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

async function readRaw(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null;
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function writeRawStrict(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    const storage = getWebStorage();
    if (!storage) throw new Error('Local storage is unavailable.');
    storage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function writeRaw(key: string, value: string): Promise<void> {
  try {
    await writeRawStrict(key, value);
  } catch {
    // Most local-only settings are optional: a device that refuses to store
    // one still works, it simply forgets that setting.
  }
}

export async function getLocalSetting<T>(key: string, fallback: T): Promise<T> {
  const raw = await readRaw(`${KEY_PREFIX}${key}`);
  if (raw === null) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setLocalSetting<T>(key: string, value: T): Promise<void> {
  await writeRaw(`${KEY_PREFIX}${key}`, JSON.stringify(value));
}

/**
 * Same existing app-private store, but lets required workflows surface a real
 * write failure instead of navigating as though data was persisted.
 */
export async function setLocalSettingStrict<T>(key: string, value: T): Promise<void> {
  await writeRawStrict(KEY_PREFIX + key, JSON.stringify(value));
}

export const LOCAL_SETTING_KEYS = {
  /** `true` when the user has agreed to anonymous usage analytics. */
  analyticsEnabled: 'analytics_enabled',
  /** 24h "HH:MM" for the wind-down reminder. */
  reminderTime: 'reminder_time',
} as const;

/** Analytics is opt-in: nothing is sent until the user turns it on. */
export const ANALYTICS_ENABLED_DEFAULT = false;
export const REMINDER_TIME_DEFAULT = '21:30';
