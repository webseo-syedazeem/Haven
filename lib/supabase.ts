import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { setSessionSource } from './auth/session-state';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { realtimeTransport } from './realtimeTransport';

const supabaseUrl = 'https://wqludhqymhcyrjhazjcq.supabase.co';
export const supabaseConfigurationError = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
  ? null
  : 'EXPO_PUBLIC_SUPABASE_ANON_KEY is missing. Configure the production EAS environment.';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || 'missing-supabase-anon-key';

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
}

const CHUNK_SIZE = 1800;

/**
 * A failed secure-store write otherwise surfaces only as "logged out on next
 * launch", which is almost impossible to diagnose in the field. Report it.
 */
function reportSecureStoreError(operation: string, error: unknown) {
  if (__DEV__) {
    console.warn(`[secure-store] ${operation} failed`, error);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Sentry = require('@sentry/react-native');
    Sentry.captureException?.(error, { tags: { subsystem: 'secure-store', operation } });
  } catch {
    // Sentry may be unavailable (e.g. web/test) — the dev warning above still fires.
  }
}

/**
 * Deletes every representation of `key` — the single-value entry, and any
 * chunk set with its `_count`. Shared by setItem and removeItem so a write
 * always starts from a clean slate.
 */
async function deleteAllChunks(key: string): Promise<void> {
  const chunkCount = await SecureStore.getItemAsync(`${key}_count`);
  if (chunkCount) {
    const count = parseInt(chunkCount, 10);
    // Delete the count FIRST so a crash mid-delete can never leave a count that
    // outlives its chunks (which getItem would then reassemble into garbage).
    await SecureStore.deleteItemAsync(`${key}_count`);
    await Promise.all(
      Array.from({ length: Number.isFinite(count) ? count : 0 }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}_${i}`)
      )
    );
  }
  await SecureStore.deleteItemAsync(key);
}

const createChunkedSecureStore = () => {
  return {
    async getItem(key: string): Promise<string | null> {
      try {
        if (Platform.OS === 'web') {
          return getWebStorage()?.getItem(key) ?? null;
        }

        const chunkCount = await SecureStore.getItemAsync(`${key}_count`);
        if (!chunkCount) return await SecureStore.getItemAsync(key);
        const count = parseInt(chunkCount, 10);
        let value = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk) value += chunk;
        }
        return value || null;
      } catch (error) {
        reportSecureStoreError('getItem', error);
        return null;
      }
    },

    async setItem(key: string, value: string): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          getWebStorage()?.setItem(key, value);
          return;
        }

        // Clear any previous representation first: a short write after a chunked
        // write used to leave a stale `${key}_count`, so getItem kept returning
        // the OLD chunked value forever (audit H-7).
        await deleteAllChunks(key);

        if (value.length <= CHUNK_SIZE) {
          await SecureStore.setItemAsync(key, value);
          return;
        }

        const chunks: string[] = [];
        for (let i = 0; i < value.length; i += CHUNK_SIZE) {
          chunks.push(value.slice(i, i + CHUNK_SIZE));
        }
        // Write the chunks first and the count LAST, so a crash mid-write never
        // leaves a count pointing at chunks that aren't all there.
        await Promise.all(
          chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk))
        );
        await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
      } catch (error) {
        reportSecureStoreError('setItem', error);
      }
    },

    async removeItem(key: string): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          getWebStorage()?.removeItem(key);
          return;
        }
        await deleteAllChunks(key);
      } catch (error) {
        reportSecureStoreError('removeItem', error);
      }
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: realtimeTransport,
  },
  auth: {
    storage: createChunkedSecureStore(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Google/Apple sign in store their session with Supabase rather than with the
// Passage API tokens, so mirror it into the shared session flag. This also fires
// once on start up with the session restored from SecureStore (or `null` on a
// fresh install, which keeps authenticated queries disabled).
supabase.auth.onAuthStateChange((_event, session) => {
  setSessionSource('supabase', Boolean(session?.access_token));
});
