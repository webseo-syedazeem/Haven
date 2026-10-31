import { SHOW_DEV_RESET_BUTTON } from '@/config/dev-flags';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { clearPersistedQueryCache } from '@/lib/query-persist';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';
import { setGuestModeActive, setSessionSource } from '@/lib/auth/session-state';

// All known SecureStore keys this app ever writes to
const SECURE_STORE_KEYS = [
  'passage.auth.access_token',
  'passage.auth.refresh_token',
  'access_token',
  // local-settings
  'passage.settings.analytics_enabled',
  'passage.settings.reminder_time',
  'passage.settings.guest_mode_active',
  'passage.settings.loop_enabled',
  // supabase chunked session key
  'sb-wqludhqymhcyrjhazjcq-auth-token',
  'sb-wqludhqymhcyrjhazjcq-auth-token_count',
  'sb-wqludhqymhcyrjhazjcq-auth-token_0',
  'sb-wqludhqymhcyrjhazjcq-auth-token_1',
  'sb-wqludhqymhcyrjhazjcq-auth-token_2',
];

async function hardReset() {
  // 1. Wipe all AsyncStorage (is_intro, is_guest, offline-session, etc.)
  try {
    await AsyncStorage.clear();
  } catch {}

  // 2. Wipe all known SecureStore keys
  if (Platform.OS !== 'web') {
    await Promise.allSettled(
      SECURE_STORE_KEYS.map((key) => SecureStore.deleteItemAsync(key))
    );
  }

  // 3. Sign out of supabase (also clears its chunked storage)
  try {
    await supabase.auth.signOut();
  } catch {}

  // 4. Clear in-memory session state
  setSessionSource('passage', false);
  setSessionSource('supabase', false);
  await setGuestModeActive(false);

  // 5. Clear React Query cache — memory + disk
  queryClient.clear();
  await clearPersistedQueryCache();
}

export function DevResetButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Position: starts bottom-right
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  // Track whether the gesture was a drag or a tap
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: (_, gestureState) => {
        isDragging.current = false;
        startPos.current = { x: gestureState.x0, y: gestureState.y0 };
        // @ts-ignore — _value is internal but stable
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        const moved =
          Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6;
        if (moved) isDragging.current = true;
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gestureState);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  const handlePress = async () => {
    if (isDragging.current || busy) return;
    setBusy(true);
    try {
      await hardReset();
      // Replace entire navigation stack with the very first screen
      router.replace('/?reset=1');
    } finally {
      setBusy(false);
    }
  };

  if (!SHOW_DEV_RESET_BUTTON) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.wrapper, { transform: pan.getTranslateTransform() }]}>
      <Pressable
        onPress={() => void handlePress()}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.inner}>
            <Text style={styles.icon}>↺</Text>
            <Text style={styles.label}>RESET</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    bottom: 100,
    position: 'absolute',
    right: 20,
    zIndex: 9999,
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(220, 53, 53, 0.92)',
    borderRadius: 28,
    elevation: 8,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    width: 56,
  },
  buttonPressed: {
    backgroundColor: 'rgba(180, 30, 30, 0.95)',
  },
  inner: {
    alignItems: 'center',
  },
  icon: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 22,
  },
  label: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 9,
    marginTop: 1,
  },
});
