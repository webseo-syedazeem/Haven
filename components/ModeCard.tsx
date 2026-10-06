import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  HalcyonCardGradient,
  HalcyonCardGradientLocations,
  HalcyonColors,
  HalcyonRadius,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import type { ModeConfig } from '@/constants/modes';

type ModeCardProps = {
  mode: ModeConfig;
  onPress?: (mode: ModeConfig) => void;
};

export function ModeCard({ mode, onPress }: ModeCardProps) {
  return (
    <View
      style={[
        styles.ring,
        {
          borderColor: mode.ringColor,
          shadowColor: mode.ringColor,
        },
      ]}>
      <Pressable
        accessibilityLabel={`${mode.label}. ${mode.tagline}`}
        accessibilityRole="button"
        onPress={() => onPress?.(mode)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        {/* Painted first so the card still reads while the artwork decodes. */}
        <LinearGradient colors={mode.gradient} style={StyleSheet.absoluteFill} />
        <Image
          contentFit="cover"
          contentPosition={mode.artworkPosition ?? 'center'}
          source={mode.artwork}
          style={StyleSheet.absoluteFill}
          transition={220}
        />
        <LinearGradient
          colors={HalcyonCardGradient as unknown as readonly [string, string, ...string[]]}
          locations={HalcyonCardGradientLocations as unknown as readonly [number, number, ...number[]]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.row}>
          <View style={styles.copy}>
            <Text style={styles.title}>{mode.label.toUpperCase()}</Text>
            <Text numberOfLines={1} style={styles.tagline}>
              {mode.tagline}
            </Text>
          </View>
          <Ionicons color={HalcyonColors.textPrimary} name="chevron-forward" size={18} />
        </View>
      </Pressable>
    </View>
  );
}

/** Same footprint as the card, shown while the screen is still settling. */
export function ModeCardSkeleton() {
  return <View style={[styles.card, styles.skeleton]} />;
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: 'transparent',
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    // borderColor and shadowColor applied inline (mode-specific)
    elevation: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
  },
  card: {
    aspectRatio: 2.6,
    borderRadius: HalcyonRadius.card,
    justifyContent: 'flex-end',
    minHeight: 118,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.88,
  },
  skeleton: {
    backgroundColor: HalcyonColors.skeleton,
  },
  row: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    paddingBottom: 16,
    paddingHorizontal: 18,
  },
  copy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 38,
    letterSpacing: 1.5,
    lineHeight: 44,
  },
  tagline: {
    color: 'rgba(241,236,227,0.82)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
