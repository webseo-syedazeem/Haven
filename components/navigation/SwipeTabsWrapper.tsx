import { useNavigation } from 'expo-router';
import { ReactNode, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const DISTANCE_THRESHOLD = 60;   // min horizontal px to count as a swipe
const VELOCITY_THRESHOLD = 500;  // or a fast flick

export function SwipeTabsWrapper({ children }: { children: ReactNode }) {
  const navigation = useNavigation();

  const goToAdjacentTab = useCallback(
    (direction: 1 | -1) => {
      const state = navigation.getState();
      if (!state) return;
      const nextIndex = state.index + direction;
      if (nextIndex < 0 || nextIndex >= state.routes.length) return;
      navigation.navigate(state.routes[nextIndex].name as never);
    },
    [navigation]
  );

  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-20, 20]) // only start once it's clearly horizontal
    .failOffsetY([-20, 20])   // give up if it's a vertical scroll
    .onEnd((e) => {
      const passed =
        Math.abs(e.translationX) > DISTANCE_THRESHOLD ||
        Math.abs(e.velocityX) > VELOCITY_THRESHOLD;
      if (!passed) return;
      goToAdjacentTab(e.translationX < 0 ? 1 : -1); // swap 1 / -1 to reverse
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.fill}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: '#fff' } });