import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { PassageColors } from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { usePlayerProgress, usePlayerState, usePlayerActions } from '@/lib/player/PlayerProvider';

const MINI_PLAYER_CARD_HEIGHT = 66;
const MINI_PLAYER_BOTTOM_GAP = 7;

export const MINI_PLAYER_HEIGHT = MINI_PLAYER_CARD_HEIGHT + MINI_PLAYER_BOTTOM_GAP;

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

  const backgroundColor = soundscape.colour || PassageColors.accent;
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
            <ActivityIndicator color={PassageColors.background} size="small" />
          ) : (
            <Ionicons
              color={PassageColors.background}
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
    backgroundColor: PassageColors.surfaceRaised,
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
    backgroundColor: PassageColors.surfaceRaised,
  },
  copy: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 6,
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 19,
  },
  meta: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  metaError: {
    color: PassageColors.accent,
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
    backgroundColor: PassageColors.accentPressed,
  },
  playIcon: {
    marginLeft: 2,
  },
});
