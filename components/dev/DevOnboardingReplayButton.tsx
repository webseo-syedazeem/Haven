import { SHOW_DEV_ONBOARDING_REPLAY_BUTTON } from '@/config/dev-flags';
import { useRouter, useSegments } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSinglePress } from '@/hooks/useSinglePress';
import { beginOnboardingReplay } from '@/lib/onboarding-replay';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

/**
 * First path segment of every screen the button must stay off of: the
 * onboarding flow itself (so it never appears mid-replay) and every
 * login/signup screen.
 */
const HIDDEN_ON_FIRST_SEGMENTS = new Set([
  'onboarding',
  'why-passage',
  'what-it-does',
  'select-focus',
  'stress-intro-1',
  'stress-intro-2',
  'trusted',
  'backed-by-science',
  'unique',
  'welcome',
  'create-account',
  'login',
  'verify-email',
  'verified',
  'reset-password',
  'change-password',
  'auth',
]);

export function DevOnboardingReplayButton() {
  const segments = useSegments();
  const router = useRouter();
  const { stop } = usePlayerActions();
  const [busy, setBusy] = useState(false);
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const isDragging = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        isDragging.current = false;
        // @ts-ignore — _value is internal but stable and matches the reset control.
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 6 || Math.abs(gestureState.dy) > 6) {
          isDragging.current = true;
        }
        Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        })(_, gestureState);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // `segments[0]` is undefined on the launch screen ('/') — nothing to
  // replay from there, so that counts as hidden too.
  const firstSegment: string | undefined = segments[0];
  const hidden =
    !SHOW_DEV_ONBOARDING_REPLAY_BUTTON ||
    !firstSegment ||
    HIDDEN_ON_FIRST_SEGMENTS.has(firstSegment);

  const handlePress = useSinglePress(() => {
    if (isDragging.current) return;
    if (busy) return;
    setBusy(true);
    void (async () => {
      try {
        await stop();
        await beginOnboardingReplay();
        if (router.canDismiss()) router.dismissAll();
        router.replace('/why-passage');
      } finally {
        setBusy(false);
      }
    })();
  });

  if (hidden) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.wrapper, { transform: pan.getTranslateTransform() }]}>
      <Pressable
        disabled={busy}
        onPress={handlePress}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
        {busy ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <View style={styles.inner}>
            <Text style={styles.icon}>⟲</Text>
            <Text style={styles.label}>REPLAY</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    bottom: 164,
    position: 'absolute',
    right: 20,
    zIndex: 9999,
  },
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 207, 0.92)',
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
    backgroundColor: 'rgba(25, 70, 150, 0.95)',
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
