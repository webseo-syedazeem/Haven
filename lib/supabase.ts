import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = 'https://wqludhqymhcyrjhazjcq.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') {
      return null;
    }

    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    return SecureStore.getItemAsync(key);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }

    SecureStore.deleteItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }

    SecureStore.setItemAsync(key, value);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: false,
    persistSession: true,
    storage: ExpoSecureStoreAdapter,
  },
});
