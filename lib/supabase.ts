import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import NodeWebSocket from 'ws';

const supabaseUrl = 'https://wqludhqymhcyrjhazjcq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Expo Router renders web routes in Node before hydrating them in the browser.
// Node versions without a global WebSocket therefore need an explicit transport.
const realtimeTransport =
  typeof globalThis.WebSocket === 'undefined'
    ? NodeWebSocket
    : globalThis.WebSocket;

function getWebStorage() {
  return typeof globalThis !== 'undefined'
    ? (globalThis as unknown as { localStorage?: Storage }).localStorage
    : undefined;
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
      } catch {
        return null;
      }
    },

    async setItem(key: string, value: string): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          getWebStorage()?.setItem(key, value);
          return;
        }

        const chunkSize = 1800;
        if (value.length <= chunkSize) {
          await SecureStore.setItemAsync(key, value);
          return;
        }
        const chunks = [];
        for (let i = 0; i < value.length; i += chunkSize) {
          chunks.push(value.slice(i, i + chunkSize));
        }
        await SecureStore.setItemAsync(`${key}_count`, String(chunks.length));
        await Promise.all(
          chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk))
        );
      } catch {}
    },

    async removeItem(key: string): Promise<void> {
      try {
        if (Platform.OS === 'web') {
          getWebStorage()?.removeItem(key);
          return;
        }

        const chunkCount = await SecureStore.getItemAsync(`${key}_count`);
        if (chunkCount) {
          const count = parseInt(chunkCount, 10);
          await SecureStore.deleteItemAsync(`${key}_count`);
          await Promise.all(
            Array.from({ length: count }, (_, i) =>
              SecureStore.deleteItemAsync(`${key}_${i}`)
            )
          );
        }
        await SecureStore.deleteItemAsync(key);
      } catch {}
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
