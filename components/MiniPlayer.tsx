import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { HalcyonColors } from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { usePlayerProgress, usePlayerState, usePlayerActions } from '@/lib/player/PlayerProvider';

const MINI_PLAYER_CARD_HEIGHT = 66;
const MINI_PLAYER_BOTTOM_GAP = 7;

export const MINI_PLAYER_HEIGHT = MINI_PLAYER_CARD_HEIGHT + MINI_PLAYER_BOTTOM_GAP;

type MiniPlayerMood = 'focus' | 'sleep' | 'relax';

function createMoodPalette(
  hues: readonly number[],
  count: number,
  saturationBase: number,
  lightnessBase: number
): string[] {
  return Array.from({ length: count }, (_, index) => {
    const hue = hues[index % hues.length] + (Math.floor(index / hues.length) % 3) * 2;
    const saturation = saturationBase + (index % 4) * 3;
    const lightness = lightnessBase + (Math.floor(index / 4) % 4) * 2;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
}

/**
 * Exactly 100 restrained backgrounds, grouped by listening mood. Bright,
 * fluorescent and high-saturation colours are deliberately excluded so the
 * player stays calm and white text remains readable on both platforms.
 */
const MINI_PLAYER_BACKGROUNDS: Record<MiniPlayerMood, string[]> = {
  focus: createMoodPalette([188, 196, 204, 212, 220, 228], 34, 24, 17),
  sleep: createMoodPalette([216, 224, 232, 240, 248, 256], 33, 22, 15),
  relax: createMoodPalette([26, 36, 46, 128, 140, 152, 164, 176], 33, 20, 17),
};

const ALL_MINI_PLAYER_BACKGROUNDS = Object.values(MINI_PLAYER_BACKGROUNDS).flat();
let previousBackground = '';

function pickMiniPlayerBackground(mode?: string | null): string {
  const normalizedMode = mode?.toLowerCase() as MiniPlayerMood | undefined;
  const palette = normalizedMode && MINI_PLAYER_BACKGROUNDS[normalizedMode]
    ? MINI_PLAYER_BACKGROUNDS[normalizedMode]
    : ALL_MINI_PLAYER_BACKGROUNDS;

  let background = palette[Math.floor(Math.random() * palette.length)];
  if (background === previousBackground && palette.length > 1) {
    background = palette[(palette.indexOf(background) + 1) % palette.length];
  }
  previousBackground = background;
  return background;
}

/**
 * Sits directly above the tab bar on every tab for as long as a soundscape is
 * loaded, playing or paused. Tapping it opens the full screen player.
 */
export function MiniPlayer() {
  const router = useRouter();
  const { soundscape, isPlaying, isBuffering, error } = usePlayerState();
  const { position, duration } = usePlayerProgress();
  const { togglePlayPause } = usePlayerActions();
  const backgroundColor = useMemo(() => {
    if (!soundscape?.id) return MINI_PLAYER_BACKGROUNDS.focus[0];
    return pickMiniPlayerBackground(soundscape.mode);
  }, [soundscape?.id, soundscape?.mode]);

  if (!soundscape) return null;

  const total = duration || soundscape.duration_seconds || 0;
  const progress = total > 0 ? Math.min(1, Math.max(0, position / total)) : 0;
  const modeLabel = getModeLabel(soundscape.mode);
  const subtitle = error ?? modeLabel;

  return (
    <Pressable
      accessibilityLabel={`Open player for ${soundscape.title}`}
      accessibilityRole="button"
      onPress={() => router.push('/player' as Href)}
      style={({ pressed }) => [
        styles.wrapper,
        { backgroundColor },
        pressed && styles.rowPressed,
      ]}>
      <View style={styles.row}>
        <View style={styles.artworkFrame}>
          <CoverImage size="sm" style={styles.artwork} uri={soundscape.artwork_url} />
        </View>

        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>
            {soundscape.title}
          </Text>
          {!!subtitle && (
            <Text numberOfLines={1} style={[styles.meta, !!error && styles.metaError]}>
              {subtitle}
            </Text>
          )}
        </View>

        <Pressable
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          accessibilityRole="button"
          hitSlop={10}
          onPress={(event) => {
            event.stopPropagation();
            void togglePlayPause();
          }}
          style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}>
          {isBuffering && !isPlaying ? (
            <ActivityIndicator color={HalcyonColors.background} size="small" />
          ) : (
            <Ionicons
              color={HalcyonColors.background}
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              style={isPlaying ? undefined : styles.playIcon}
            />
          )}
        </Pressable>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderColor: 'rgba(255,255,255,0.11)',
    borderRadius: 17,
    borderWidth: 1,
    elevation: 9,
    marginBottom: MINI_PLAYER_BOTTOM_GAP,
    marginHorizontal: 8,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    bottom: 5,
    height: 3,
    left: 8,
    overflow: 'hidden',
    position: 'absolute',
    right: 8,
  },
  progressFill: {
    backgroundColor: '#F6EFE6',
    borderRadius: 999,
    height: '100%',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    height: MINI_PLAYER_CARD_HEIGHT,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },
  rowPressed: {
    opacity: 0.9,
  },
  artworkFrame: {
    backgroundColor: HalcyonColors.surfaceRaised,
    borderRadius: 10,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  artwork: {
    height: '100%',
    width: '100%',
  },
  artworkFallback: {
    backgroundColor: HalcyonColors.surfaceRaised,
  },
  copy: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 6,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  metaError: {
    color: HalcyonColors.accent,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: '#F6EFE6',
    borderRadius: 19,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  playButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  playIcon: {
    marginLeft: 2,
  },
});
