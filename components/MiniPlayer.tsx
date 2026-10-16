import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { HalcyonColors } from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { usePlayerProgress, usePlayerState, usePlayerActions } from '@/lib/player/PlayerProvider';

export const MINI_PLAYER_HEIGHT = 62;

/**
 * Sits directly above the tab bar on every tab for as long as a soundscape is
 * loaded, playing or paused. Tapping it opens the full screen player.
 */
export function MiniPlayer() {
  const router = useRouter();
  const { soundscape, isPlaying, isBuffering, error } = usePlayerState();
  const { position, duration } = usePlayerProgress();
  const { togglePlayPause } = usePlayerActions();

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
      style={({ pressed }) => [styles.wrapper, pressed && styles.rowPressed]}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { flex: progress }]} />
        <View style={{ flex: 1 - progress }} />
      </View>

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
              size={17}
              style={isPlaying ? undefined : styles.playIcon}
            />
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopWidth: 1,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    height: 2,
  },
  progressFill: {
    backgroundColor: HalcyonColors.accent,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    height: MINI_PLAYER_HEIGHT - 2,
    paddingHorizontal: 14,
  },
  rowPressed: {
    opacity: 0.9,
  },
  artworkFrame: {
    backgroundColor: HalcyonColors.surfaceRaised,
    borderRadius: 10,
    height: 42,
    overflow: 'hidden',
    width: 42,
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
    paddingHorizontal: 12,
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
    backgroundColor: HalcyonColors.accent,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  playButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  playIcon: {
    marginLeft: 2,
  },
});
