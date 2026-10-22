import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Small key/value store for preferences the backend has no column for.
 *
 * Everything here is device-local and never leaves the phone. It exists for
 * settings the API cannot hold today:
 *
 * - `reminder_time` — `user_notification_settings` stores `reminders_enabled`
 *   but no time, so the chosen hour lives here and drives the locally
 *   scheduled reminder.
 * - `loop_enabled` — the player's "Continuous loop" toggle has no server column,
 *   so the preference lives here and is read once on provider mount.
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
  /** 24h "HH:MM" for the wind-down reminder. */
  reminderTime: 'reminder_time',
  /** Legacy guest flag, read once when migrating older installs to AsyncStorage. */
  guestModeActive: 'guest_mode_active',
  /** The player's "Continuous loop" (repeat-one) toggle. */
  loopEnabled: 'loop_enabled',
} as const;

export const GUEST_MODE_ACTIVE_DEFAULT = false;

/** Analytics is opt-in: nothing is sent until the user turns it on. */
export const REMINDER_TIME_DEFAULT = '21:30';

/** Off by default: a track only repeats once the listener asks for it. */
export const LOOP_ENABLED_DEFAULT = false;
