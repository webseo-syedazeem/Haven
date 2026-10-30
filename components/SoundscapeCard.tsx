import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { PassageColors, PassageRadius } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import type { Soundscape } from '@/lib/api/home';
import { formatDuration } from '@/lib/utils/duration';

export const SOUNDSCAPE_CARD_WIDTH = 132;

type SoundscapeCardProps = {
  soundscape: Soundscape;
  onPress?: (soundscape: Soundscape) => void;
  onPlay?: (soundscape: Soundscape) => void;
  /**
   * Off for the Home rails, which match the mockup's plain card. Library and
   * Saved can turn the heart on without a second card component.
   */
  showFavourite?: boolean;
  isFavourite?: boolean;
  onToggleFavourite?: (soundscape: Soundscape, isFavourite: boolean) => void;
  /** Optional custom width for grid layouts */
  width?: number;
};

export function SoundscapeCard({
  soundscape,
  onPress,
  onPlay,
  showFavourite = false,
  isFavourite = false,
  onToggleFavourite,
  width = SOUNDSCAPE_CARD_WIDTH,
}: SoundscapeCardProps) {
  const duration = formatDuration(soundscape.duration_seconds);
  const title = soundscape.short_title?.trim() || soundscape.title;

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={() => onPress?.(soundscape)}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}>
      <View style={[styles.artworkFrame, { width, height: width }]}>
        <CoverImage size="sm" style={styles.artwork} uri={soundscape.artwork_url} />
        <Pressable
          accessibilityLabel={`Play ${title}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onPlay?.(soundscape)}
          style={({ pressed }) => [styles.playBadge, pressed && styles.playBadgePressed]}>
          <Ionicons color={PassageColors.textPrimary} name="play" size={13} style={styles.playIcon} />
        </Pressable>
        {showFavourite && (
          <Pressable
            accessibilityLabel={
              isFavourite ? `Remove ${title} from favourites` : `Save ${title} to favourites`
            }
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => onToggleFavourite?.(soundscape, isFavourite)}
            style={({ pressed }) => [styles.favouriteBadge, pressed && styles.playBadgePressed]}>
            <Ionicons
              color={isFavourite ? PassageColors.accent : PassageColors.textPrimary}
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={14}
            />
          </Pressable>
        )}
      </View>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {!!duration && <Text style={styles.duration}>{duration}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    // Width is set dynamically via inline style
  },
  cardPressed: {
    opacity: 0.82,
  },
  artworkFrame: {
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.artwork,
    borderWidth: 1,
    // Width and height are set dynamically via inline style
    overflow: 'hidden',
  },
  artwork: {
    height: '100%',
    width: '100%',
  },
  artworkFallback: {
    backgroundColor: PassageColors.surfaceRaised,
  },
  playBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,13,0.55)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 15,
    borderWidth: 1,
    bottom: 8,
    height: 30,
    justifyContent: 'center',
    left: 8,
    position: 'absolute',
    width: 30,
  },
  playBadgePressed: {
    backgroundColor: 'rgba(11,11,13,0.78)',
  },
  favouriteBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,13,0.55)',
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 15,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 30,
  },
  playIcon: {
    marginLeft: 2,
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 10,
  },
  duration: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
});
