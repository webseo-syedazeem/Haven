import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ScreenWrapper, useScreenBottomPadding } from '@/components/ScreenWrapper';
import { AppFonts } from '@/constants/theme';

const HEART_ICON = require('@/assets/images/step_heart.svg');
const LOTUS_ICON = require('@/assets/images/flower-lotus.svg');
const SLIDER_THUMB_SIZE = 26;
const VALUE_BUBBLE_SIZE = 35;

type StressSliderProps = {
  value: number;
  onChange: (value: number) => void;
  onInteract?: () => void;
};

function StressSlider({ value, onChange, onInteract }: StressSliderProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const bubbleX = useRef(new Animated.Value(0)).current;
  const barWidth = useRef(0);
  const currentPosition = useRef(0);
  const dragStartPosition = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onInteractRef = useRef(onInteract);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onInteractRef.current = onInteract;
  }, [onInteract]);

  const getMaxPosition = useCallback(() => Math.max(0, barWidth.current - SLIDER_THUMB_SIZE), []);
  const getBubblePosition = useCallback(
    (position: number) => {
      const centeredPosition = position + (SLIDER_THUMB_SIZE - VALUE_BUBBLE_SIZE) / 2;
      const maxBubblePosition = Math.max(0, barWidth.current - VALUE_BUBBLE_SIZE);

      return Math.min(maxBubblePosition, Math.max(0, centeredPosition));
    },
    []
  );

  const getValueFromPosition = useCallback(
    (position: number) => {
      const maxPosition = getMaxPosition();

      return maxPosition ? Math.round((position / maxPosition) * 10) : valueRef.current;
    },
    [getMaxPosition]
  );

  const moveKnobTo = useCallback(
    (position: number, animated = false) => {
      const nextPosition = Math.min(getMaxPosition(), Math.max(0, position));
      const nextValue = getValueFromPosition(nextPosition);

      currentPosition.current = nextPosition;

      if (animated) {
        Animated.timing(bubbleX, {
          toValue: getBubblePosition(nextPosition),
          duration: 160,
          useNativeDriver: true,
        }).start();
        Animated.timing(translateX, {
          toValue: nextPosition,
          duration: 160,
          useNativeDriver: true,
        }).start();
      } else {
        bubbleX.setValue(getBubblePosition(nextPosition));
        translateX.setValue(nextPosition);
      }

      if (nextValue !== valueRef.current) {
        valueRef.current = nextValue;
        onChangeRef.current(nextValue);
      }
    },
    [bubbleX, getBubblePosition, getMaxPosition, getValueFromPosition, translateX]
  );

  useEffect(() => {
    valueRef.current = value;

    if (!barWidth.current) {
      return;
    }

    moveKnobTo((value / 10) * getMaxPosition(), true);
  }, [getMaxPosition, moveKnobTo, value]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          onInteractRef.current?.();
          dragStartPosition.current = currentPosition.current;
        },
        onPanResponderMove: (_, gestureState) => {
          moveKnobTo(dragStartPosition.current + gestureState.dx);
        },
        onPanResponderRelease: (event, gestureState) => {
          if (Math.abs(gestureState.dx) < 3 && Math.abs(gestureState.dy) < 3) {
            moveKnobTo(event.nativeEvent.locationX - SLIDER_THUMB_SIZE / 2, true);
          }
        },
      }),
    [moveKnobTo]
  );

  const moveToScaleValue = (nextValue: number) => {
    onInteractRef.current?.();
    moveKnobTo((nextValue / 10) * getMaxPosition(), true);
  };

  return (
    <View style={styles.sliderSection}>
      <View
        style={styles.sliderTouchable}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;

          barWidth.current = nextWidth;
          moveKnobTo((valueRef.current / 10) * Math.max(0, nextWidth - SLIDER_THUMB_SIZE));
        }}
        {...panResponder.panHandlers}>
        <LinearGradient
          colors={['#7B61FF', '#3770FC', '#F78999']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.sliderTrack}
        />
        <Animated.View style={[styles.valueBubble, { transform: [{ translateX: bubbleX }] }]}>
          <Text style={styles.valueText}>{value}</Text>
        </Animated.View>
        <Animated.View style={[styles.sliderThumb, { transform: [{ translateX }] }]} />
      </View>

      <View style={styles.scaleRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Very calm 0"
          onPress={() => moveToScaleValue(0)}
          style={styles.scaleItem}>
          <Text style={styles.scaleNumber}>0</Text>
          <Text style={styles.scaleLabel}>Very calm</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Moderate 5"
          onPress={() => moveToScaleValue(5)}
          style={styles.scaleItemCenter}>
          <Text style={styles.scaleNumber}>5</Text>
          <Text style={styles.scaleLabel}>Moderate</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stressful 10"
          onPress={() => moveToScaleValue(10)}
          style={styles.scaleItemRight}>
          <Text style={styles.scaleNumber}>10</Text>
          <Text style={styles.scaleLabel}>Stressful</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function StressStepScreen() {
  const [stressValue, setStressValue] = useState<number | null>(7);
  const [hasSelectedStressValue, setHasSelectedStressValue] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const bottomPadding = useScreenBottomPadding();

  const handleContinuePress = () => {
    if (!hasSelectedStressValue || stressValue === null || stressValue === undefined) {
      setValidationMessage('Please select your stress level before continuing.');
      return;
    }

    setValidationMessage('');
    router.push('/daily-reflection' as Href);
  };

  const handleStressValueChange = (value: number) => {
    setStressValue(value);
    setHasSelectedStressValue(true);
    setValidationMessage('');
  };

  const handleStressInteraction = () => {
    setHasSelectedStressValue(true);
    setValidationMessage('');
  };

  return (
    <View style={styles.screen}>
      <ScreenWrapper
        backgroundImage={require('@/assets/images/step_background.png')}
        bottomReserve={0}
        middleContent={
          <ScrollView
            bounces={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}>
            <View style={styles.header}>
              <Image source={HEART_ICON} style={styles.heartIcon} contentFit="contain" />
              <Text style={styles.stepText}>Step 1 of 3</Text>
              <Text style={styles.heading}>How stressed did{'\n'}you feel today?</Text>
              <Text style={styles.subtitle}>There is no right or wrong answer</Text>
            </View>

            <StressSlider
              value={stressValue ?? 7}
              onChange={handleStressValueChange}
              onInteract={handleStressInteraction}
            />

            <View style={styles.infoCard}>
              <Image source={LOTUS_ICON} style={styles.lotusIcon} contentFit="contain" />
              <Text style={styles.infoText}>
                Noticing your stress is the first step to{'\n'}feeling better
              </Text>
            </View>

            <View style={styles.spacer} />

            <Pressable
              accessibilityRole="button"
              onPress={handleContinuePress}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}>
              <LinearGradient
                colors={['#5AA1E2', '#0D6FD0']}
                end={{ x: 0, y: 1 }}
                locations={[0.0379, 0.75]}
                start={{ x: 0, y: 0 }}
                style={styles.continueGradient}>
                <View pointerEvents="none" style={styles.innerShadow}>
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                    end={{ x: 0, y: 1 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.innerShadowTop}
                  />
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 255, 0)']}
                    end={{ x: 1, y: 0 }}
                    start={{ x: 0, y: 0 }}
                    style={styles.innerShadowLeft}
                  />
                </View>
                <Text style={styles.continueText}>Continue</Text>
              </LinearGradient>
            </Pressable>

            {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.backButton}>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </ScrollView>
        }
        middleContentStyle={styles.middleContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#7667C7',
  },
  middleContent: {
    paddingHorizontal: 20,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 60,
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heartIcon: {
    width: 68,
    height: 68,
    marginBottom: 8,
  },
  stepText: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  heading: {
    fontFamily: AppFonts.displaySemiBold,
    fontWeight: '600',
    fontSize: 32,
    lineHeight: 42,
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  subtitle: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  sliderSection: {
    width: '100%',
    marginBottom: 28,
    overflow: 'visible',
  },
  sliderTouchable: {
    width: '100%',
    height: 75,
    justifyContent: 'flex-end',
    overflow: 'visible',
    paddingBottom: 15,
  },
  sliderTrack: {
    width: '100%',
    height: 16,
    borderRadius: 999,
  },
  valueBubble: {
    position: 'absolute',
    bottom: 41,
    left: 0,
    width: VALUE_BUBBLE_SIZE,
    height: VALUE_BUBBLE_SIZE,
    borderRadius: VALUE_BUBBLE_SIZE / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  valueText: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 18,
    lineHeight: 18,
    color: '#173F5F',
  },
  sliderThumb: {
    position: 'absolute',
    left: 0,
    bottom: 10,
    width: SLIDER_THUMB_SIZE,
    height: SLIDER_THUMB_SIZE,
    borderRadius: SLIDER_THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  scaleRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  scaleItem: {
    alignItems: 'flex-start',
  },
  scaleItemCenter: {
    alignItems: 'center',
  },
  scaleItemRight: {
    alignItems: 'flex-end',
  },
  scaleNumber: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  scaleLabel: {
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  infoCard: {
    width: '100%',
    minHeight: 60,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.86)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  lotusIcon: {
    width: 36,
    height: 36,
    marginRight: 11,
  },
  infoText: {
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 22,
    color: '#54555A',
  },
  spacer: {
    flex: 1,
    minHeight: 92,
  },
  validationText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  continueButton: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#0d6fd0',
    borderRadius: 27,
    elevation: 0,
    height: 54,
    marginBottom: 18,
    maxWidth: 348,
    overflow: 'hidden',
    width: '100%',
  },
  continueGradient: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  continueText: {
    color: '#ffffff',
    fontFamily: AppFonts.sansMedium,
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 26,
    textAlign: 'center',
  },
  innerShadow: {
    ...StyleSheet.absoluteFillObject,
  },
  innerShadowLeft: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 4,
    width: 16,
  },
  innerShadowTop: {
    height: 16,
    left: 4,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  backButton: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  backText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansMedium,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
});
