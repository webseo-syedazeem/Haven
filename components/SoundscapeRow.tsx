import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { PassageColors, PassageSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import type { Soundscape } from '@/lib/api/home';
import { formatDuration } from '@/lib/utils/duration';

export const SOUNDSCAPE_ROW_HEIGHT = 76;
const THUMBNAIL = 56;

type SoundscapeRowProps = {
  soundscape: Soundscape;
  onPress?: (soundscape: Soundscape) => void;
  onPlay?: (soundscape: Soundscape) => void;
  showFavourite?: boolean;
  isFavourite?: boolean;
  onToggleFavourite?: (soundscape: Soundscape, isFavourite: boolean) => void;
  /** Replaces the heart — used by playlist detail and the Saved tab's rows. */
  trailing?: ReactNode;
  /** Drag handle or index, shown before the thumbnail. */
  leading?: ReactNode;
  /** Overrides the description line, e.g. a file size or a played-at stamp. */
  subtitle?: string;
  /** Adds the Saved screen's full-row outline without affecting other screens. */
  variant?: 'default' | 'saved';
};

/**
 * The vertical list counterpart to `SoundscapeCard`: thumbnail, title, one line
 * of description and a duration, with the heart on the right. Same tokens as
 * the rail card, so lists and rails read as one family.
 */
export function SoundscapeRow({
  soundscape,
  onPress,
  onPlay,
  showFavourite = false,
  isFavourite = false,
  onToggleFavourite,
  trailing,
  leading,
  subtitle,
  variant = 'default',
}: SoundscapeRowProps) {
  const title = soundscape.short_title?.trim() || soundscape.title;
  const duration = formatDuration(soundscape.duration_seconds);
  const description = subtitle ?? soundscape.one_line_description?.trim() ?? '';
  const meta = [description, duration].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="button"
      onPress={() => onPress?.(soundscape)}
      style={({ pressed }) => [
        styles.row,
        variant === 'saved' && styles.savedRow,
        pressed && styles.rowPressed,
      ]}>
      {leading}

      <Pressable
        accessibilityLabel={`Play ${title}`}
        accessibilityRole="button"
        disabled={!onPlay}
        hitSlop={6}
        onPress={() => onPlay?.(soundscape)}
        style={styles.artworkFrame}>
        <CoverImage size="sm" style={styles.artwork} uri={soundscape.artwork_url} />
        {!!onPlay && (
          <View style={styles.playScrim}>
            <Ionicons
              color={PassageColors.textPrimary}
              name="play"
              size={14}
              style={styles.playIcon}
            />
          </View>
        )}
      </Pressable>

      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {!!meta && (
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        )}
      </View>

      {trailing ??
        (showFavourite ? (
          <Pressable
            accessibilityLabel={
              isFavourite ? `Remove ${title} from favourites` : `Save ${title} to favourites`
            }
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => onToggleFavourite?.(soundscape, isFavourite)}
            style={({ pressed }) => [styles.trailingButton, pressed && styles.rowPressed]}>
            <Ionicons
              color={isFavourite ? PassageColors.accent : PassageColors.textSecondary}
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={20}
            />
          </Pressable>
        ) : null)}
    </Pressable>
  );
}

/** Matches the row footprint so a loading list does not jump when it fills. */
export function SoundscapeRowSkeleton() {
  return (
    <View style={styles.row}>
      <View style={[styles.artworkFrame, styles.skeletonBlock]} />
      <View style={styles.copy}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonMeta]} />
      </View>
    </View>
  );
}

export function SoundscapeRowSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, index) => (
        <SoundscapeRowSkeleton key={`row-skeleton-${index}`} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    columnGap: 12,
    flexDirection: 'row',
    height: SOUNDSCAPE_ROW_HEIGHT,
    paddingHorizontal: PassageSpacing.screenX,
  },
  rowPressed: {
    opacity: 0.72,
  },
  savedRow: {
    backgroundColor: 'rgba(0,0,0,0.10)',
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    marginHorizontal: PassageSpacing.screenX,
    paddingHorizontal: 9,
  },
  artworkFrame: {
    backgroundColor: PassageColors.surface,
    borderRadius: 12,
    height: THUMBNAIL,
    overflow: 'hidden',
    width: THUMBNAIL,
  },
  artwork: {
    height: '100%',
    width: '100%',
  },
  artworkFallback: {
    backgroundColor: PassageColors.surfaceRaised,
  },
  playScrim: {
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,13,0.34)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  playIcon: {
    marginLeft: 2,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  meta: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  trailingButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  skeletonBlock: {
    backgroundColor: PassageColors.skeleton,
    borderWidth: 0,
  },
  skeletonLine: {
    backgroundColor: PassageColors.skeleton,
    borderRadius: 4,
    height: 11,
  },
  skeletonTitle: {
    width: '62%',
  },
  skeletonMeta: {
    marginTop: 8,
    width: '38%',
  },
});
