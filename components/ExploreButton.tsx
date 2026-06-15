import { LinearGradient } from 'expo-linear-gradient';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { EXPLORE_GRADIENT_COLORS, EXPLORE_GRADIENT_LOCATIONS } from '@/components/explore-gradient';
import { AppFonts } from '@/constants/theme';

type ExploreButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  gradientColors?: readonly [string, string, ...string[]];
  gradientLocations?: readonly [number, number, ...number[]];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  shadowColor?: string;
};

export function ExploreButton({
  label,
  loading,
  style,
  disabled,
  gradientColors = EXPLORE_GRADIENT_COLORS,
  gradientLocations = EXPLORE_GRADIENT_LOCATIONS,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
  shadowColor = 'rgb(110, 95, 230)',
  ...props
}: ExploreButtonProps) {
  return (
    <Pressable
      android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: false }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrapper,
        { shadowColor },
        pressed && styles.wrapperPressed,
        disabled && styles.wrapperDisabled,
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={gradientColors}
        locations={gradientLocations}
        start={gradientStart}
        end={gradientEnd}
        style={styles.gradient}
      >
        {/* Glassy top highlight — subtle glass sheen across the top */}
        <LinearGradient
          colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.topHighlight}
          pointerEvents="none"
        />

        {/* Left edge shade for depth */}
        <LinearGradient
          colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.leftShade}
          pointerEvents="none"
        />

        {/* Right edge shade for depth */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightShade}
          pointerEvents="none"
        />

        {/* Bottom inner shadow for depth */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bottomShadow}
          pointerEvents="none"
        />

        {/* Subtle outer border for glass edge */}
        <View pointerEvents="none" style={styles.border} />

        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text numberOfLines={1} style={styles.label}>{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 60,
    elevation: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    width: '100%',
  },
  wrapperPressed: {
    transform: [{ translateY: 2 }, { scale: 0.99 }],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    elevation: 6,
  },
  wrapperDisabled: {
    opacity: 0.55,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    width: '100%',
    position: 'relative',
  },
  topHighlight: {
    height: '40%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  leftShade: {
    top: 0,
    bottom: 0,
    left: 0,
    position: 'absolute',
    width: '6%',
  },
  rightShade: {
    top: 0,
    bottom: 0,
    right: 0,
    position: 'absolute',
    width: '6%',
  },
  bottomShadow: {
    bottom: 0,
    height: '45%',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  border: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  label: {
    color: '#ffffff',
    fontFamily: AppFonts.sansBold,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
});