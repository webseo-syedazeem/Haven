import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

import { wellnessColors, wellnessRadius } from '@/constants/wellness-theme';

type GradientProgressBarProps = {
  value?: number;
  onChange?: (value: number) => void;
};

const clampProgress = (value: number) => Math.min(1, Math.max(0, value));
const getMoodIndex = (value: number) => Math.min(3, Math.floor(clampProgress(value) * 4));
const THUMB_SIZE = 30;

export function GradientProgressBar({ value = 0.28, onChange }: GradientProgressBarProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(0);
  const isDragging = useRef(false);
  const dragStartPosition = useRef(0);
  const currentPosition = useRef(0);
  const lastMoodIndex = useRef(getMoodIndex(value));
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(clampProgress(value));

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const getMaxPosition = useCallback(() => Math.max(0, barWidth.current - THUMB_SIZE), []);

  const getProgressFromPosition = useCallback(
    (position: number) => {
      const maxPosition = getMaxPosition();

      return maxPosition ? clampProgress(position / maxPosition) : valueRef.current;
    },
    [getMaxPosition]
  );

  const moveKnobTo = useCallback(
    (position: number) => {
      const nextPosition = Math.min(getMaxPosition(), Math.max(0, position));

      currentPosition.current = nextPosition;
      translateX.setValue(nextPosition);

      const nextProgress = getProgressFromPosition(nextPosition);
      const nextMoodIndex = getMoodIndex(nextProgress);

      if (nextMoodIndex !== lastMoodIndex.current) {
        lastMoodIndex.current = nextMoodIndex;
        onChangeRef.current?.(nextProgress);
      }
    },
    [getMaxPosition, getProgressFromPosition, translateX]
  );

  useEffect(() => {
    const nextValue = clampProgress(value);

    valueRef.current = nextValue;

    if (!barWidth.current || isDragging.current) {
      return;
    }

    const nextPosition = nextValue * getMaxPosition();

    currentPosition.current = nextPosition;
    lastMoodIndex.current = getMoodIndex(nextValue);
    translateX.setValue(nextPosition);
  }, [getMaxPosition, translateX, value]);

  const finishDrag = useCallback(() => {
    isDragging.current = false;

    onChangeRef.current?.(getProgressFromPosition(currentPosition.current));
  }, [getProgressFromPosition]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          isDragging.current = true;
          dragStartPosition.current = currentPosition.current;
        },
        onPanResponderMove: (_, gestureState) => {
          if (!barWidth.current) {
            return;
          }

          moveKnobTo(dragStartPosition.current + gestureState.dx);
        },
        onPanResponderRelease: finishDrag,
        onPanResponderTerminate: finishDrag,
      }),
    [finishDrag, moveKnobTo]
  );

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        const nextTrackWidth = event.nativeEvent.layout.width;

        barWidth.current = nextTrackWidth;

        if (!isDragging.current) {
          const nextPosition = valueRef.current * Math.max(0, nextTrackWidth - THUMB_SIZE);

          currentPosition.current = nextPosition;
          translateX.setValue(nextPosition);
        }
      }}
      {...panResponder.panHandlers}>
      <LinearGradient
        colors={[
          wellnessColors.progress.calm,
          wellnessColors.progress.tense,
          wellnessColors.progress.anxious,
          wellnessColors.progress.overwhelmed,
        ]}
        locations={[0, 0.2899, 0.686, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.track}
      />
      <Animated.View
        accessibilityRole="adjustable"
        style={[styles.thumb, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[wellnessColors.white, wellnessColors.progress.thumbEnd]}
          locations={[0, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.thumbGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 32,
    justifyContent: 'center',
  },
  track: {
    height: 14,
    borderRadius: wellnessRadius.pill,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 7,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: wellnessColors.white,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  thumbGradient: {
    flex: 1,
  },
});
