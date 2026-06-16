import { LinearGradient } from 'expo-linear-gradient';
import type { LinearGradientProps } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppFonts } from '@/constants/theme';

export const EXPLORE_GRADIENT_COLORS = ['#5a86ef', '#8c8af0', '#c285e8'] as const;
export const EXPLORE_GRADIENT_LOCATIONS = [0, 0.5, 1] as const;

type ExploreGradientProps = Pick<LinearGradientProps, 'colors' | 'locations' | 'start' | 'end'>;

export const exploreGradientHorizontal: ExploreGradientProps = {
  colors: EXPLORE_GRADIENT_COLORS,
  locations: EXPLORE_GRADIENT_LOCATIONS,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
};

export const exploreGradientVertical: ExploreGradientProps = {
  colors: EXPLORE_GRADIENT_COLORS,
  locations: EXPLORE_GRADIENT_LOCATIONS,
  start: { x: 0.5, y: 1 },
  end: { x: 0.5, y: 0 },
};

export function ExploreGradientFill({
  borderRadius,
  colors = EXPLORE_GRADIENT_COLORS,
  locations = EXPLORE_GRADIENT_LOCATIONS,
}: {
  borderRadius: number;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
}) {
  return (
    <>
      <LinearGradient
        colors={colors}
        locations={locations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius }]}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[gradientStyles.topHighlight, { borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gradientStyles.leftShade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.12)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={gradientStyles.rightShade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={gradientStyles.bottomShadow}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={[gradientStyles.border, { borderRadius }]} />
    </>
  );
}

export function ExploreCheckBadge({
  size = 24,
  colors = EXPLORE_GRADIENT_COLORS,
  locations = EXPLORE_GRADIENT_LOCATIONS,
}: {
  size?: number;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
}) {
  return <ExploreIconBadge colors={colors} icon="checkmark" locations={locations} size={size} />;
}

export function ExploreIconBadge({
  icon,
  size = 68,
  colors = EXPLORE_GRADIENT_COLORS,
  locations = EXPLORE_GRADIENT_LOCATIONS,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  colors?: readonly [string, string, ...string[]];
  locations?: readonly [number, number, ...number[]];
}) {
  const radius = size / 2;

  return (
    <View style={[gradientStyles.checkBadge, { borderRadius: radius, height: size, width: size }]}>
      <ExploreGradientFill borderRadius={radius} colors={colors} locations={locations} />
      <Ionicons color="#FFFFFF" name={icon} size={Math.round(size * 0.58)} style={gradientStyles.checkIcon} />
    </View>
  );
}

export function ExploreGradientBanner({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[gradientStyles.banner, style]}>
      <ExploreGradientFill borderRadius={12} />
      <View style={gradientStyles.bannerContent}>{children}</View>
    </View>
  );
}

const gradientStyles = StyleSheet.create({
  topHighlight: {
    height: '40%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  leftShade: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '6%',
  },
  rightShade: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
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
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  checkBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  checkIcon: {
    position: 'relative',
    zIndex: 1,
  },
  banner: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
    zIndex: 1,
  },
  bannerText: {
    color: '#FFFFFF',
    flex: 1,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export { gradientStyles as exploreGradientStyles };
