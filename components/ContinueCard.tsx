import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
        {soundscape.artwork_url ? (
          <Image
            contentFit="cover"
            cachePolicy="memory-disk"
            source={{ uri: soundscape.artwork_url }}
            style={styles.artwork}
            transition={200}
          />
        ) : (
          <View style={[styles.artwork, styles.artworkFallback]} />
        )}
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
  return <View style={[styles.card, styles.skeleton]} />;
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
  skeleton: {
    backgroundColor: HalcyonColors.skeleton,
    borderColor: 'transparent',
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
