import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CoverImage } from '@/components/CoverImage';
import { HalcyonColors, HalcyonRadius } from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import type { Soundscape } from '@/lib/api/home';
import { formatClock, formatDuration } from '@/lib/utils/duration';

type ContinueCardProps = {
  soundscape: Soundscape;
  positionSeconds: number;
  durationSeconds?: number | null;
  onPress?: (soundscape: Soundscape) => void;
  onPlay?: (soundscape: Soundscape) => void;
};

export function ContinueCard({
  soundscape,
  positionSeconds,
  durationSeconds,
  onPress,
  onPlay,
}: ContinueCardProps) {
  const total = durationSeconds ?? soundscape.duration_seconds ?? 0;
  const progress = total > 0 ? Math.min(1, Math.max(0, positionSeconds / total)) : 0;
  const modeLabel = getModeLabel(soundscape.mode);
  const duration = formatDuration(total);
  const meta = [modeLabel, duration].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityLabel={`Continue ${soundscape.title}`}
      accessibilityRole="button"
      onPress={() => onPress?.(soundscape)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.artworkFrame}>
        <CoverImage size="sm" style={styles.artwork} uri={soundscape.artwork_url} />
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {soundscape.title}
        </Text>
        {!!meta && (
          <Text numberOfLines={1} style={styles.meta}>
            {meta}
          </Text>
        )}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        {total > 0 && (
          <Text style={styles.time}>
            {formatClock(positionSeconds)} / {formatClock(total)}
          </Text>
        )}
      </View>

      <Pressable
        accessibilityLabel={`Play ${soundscape.title}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => onPlay?.(soundscape)}
        style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}>
        <Ionicons color={HalcyonColors.background} name="play" size={18} style={styles.playIcon} />
      </Pressable>
    </Pressable>
  );
}

export function ContinueCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={[styles.artworkFrame, styles.skeletonBlock]} />
      <View style={styles.copy}>
        <View style={[styles.skeletonLine, styles.skeletonTitle]} />
        <View style={[styles.skeletonLine, styles.skeletonMeta]} />
        <View style={[styles.skeletonLine, styles.skeletonProgress]} />
      </View>
      <View style={[styles.playButton, styles.skeletonBlock]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 88,
    padding: 12,
  },
  cardPressed: {
    opacity: 0.9,
  },
  skeletonBlock: {
    backgroundColor: HalcyonColors.skeleton,
  },
  skeletonLine: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 4,
    height: 11,
  },
  skeletonTitle: {
    width: '58%',
  },
  skeletonMeta: {
    marginTop: 8,
    width: '34%',
  },
  skeletonProgress: {
    height: 3,
    marginTop: 11,
    width: '100%',
  },
  artworkFrame: {
    backgroundColor: HalcyonColors.surfaceRaised,
    borderRadius: 12,
    height: 62,
    overflow: 'hidden',
    width: 62,
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
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 2,
    flexDirection: 'row',
    height: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: HalcyonColors.accent,
  },
  time: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  playButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  playIcon: {
    marginLeft: 3,
  },
});
