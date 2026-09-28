import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaylistPickerSheet } from '@/components/PlaylistPickerSheet';
import { TimerSheet } from '@/components/TimerSheet';
import { Toast, useToast } from '@/components/Toast';
import {
  HalcyonColors,
  HalcyonModal,
  HalcyonRadius,
  HalcyonSpacing,
} from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { formatTimerLabel, UNTIL_I_STOP } from '@/constants/timers';
import { AppFonts } from '@/constants/theme';
import {
  getDownloadBlockNotice,
  useDownloadSoundscape,
  useDownloadStatus,
} from '@/hooks/useDownloads';
import { useIsFavourite, useToggleFavourite } from '@/hooks/useFavourites';
import { usePlayer } from '@/lib/player/PlayerProvider';
import { formatClock, formatDuration } from '@/lib/utils/duration';

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { notice, showToast } = useToast();

  const {
    soundscape,
    isPlaying,
    isBuffering,
    hasNext,
    hasPrevious,
    error,
    canRetry,
    timerSelection,
    isFadingOut,
    endToneEnabled,
    position,
    duration,
    timerRemainingSeconds,
    togglePlayPause,
    seek,
    skipNext,
    skipPrevious,
    setTimer,
    setEndToneEnabled,
  } = usePlayer();

  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [playlistSheetVisible, setPlaylistSheetVisible] = useState(false);

  const isFavourite = useIsFavourite(soundscape?.id);
  const { toggleFavourite } = useToggleFavourite();
  const downloadState = useDownloadStatus(soundscape?.id);
  const { download, isDownloading } = useDownloadSoundscape();

  if (!soundscape) {
    return (
      <View style={[styles.screen, styles.emptyScreen]}>
        <Text style={styles.emptyTitle}>Nothing is playing</Text>
        <Text style={styles.emptyBody}>Choose a soundscape and it will appear here.</Text>
        <Pressable
          accessibilityLabel="Close player"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
          <Text style={styles.emptyButtonLabel}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const total = duration || soundscape.duration_seconds || 0;
  const sliderValue = scrubValue ?? Math.min(position, total || position);
  const remaining = Math.max(0, total - sliderValue);
  const modeLabel = getModeLabel(soundscape.mode);
  const durationLabel = formatDuration(total);
  const meta = [modeLabel, durationLabel].filter(Boolean).join(' · ');
  const isDownloaded = downloadState?.status === 'completed';
  const downloadInFlight =
    isDownloading || downloadState?.status === 'queued' || downloadState?.status === 'downloading';

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${soundscape.title} on Passage — ${Linking.createURL(`/soundscape/${soundscape.id}`)}`,
      });
    } catch {
      showToast('Could not open the share sheet.');
    }
  };

  const handleDownload = async () => {
    if (isDownloaded) {
      showToast('Already saved to this device.');
      return;
    }

    try {
      await download(soundscape);
      showToast('Saved for offline listening.');
    } catch (error) {
      const notice = getDownloadBlockNotice(error);
      if (notice) {
        Alert.alert(notice.title, notice.message);
      } else {
        showToast('Download failed. Try again.');
      }
    }
  };

  return (
    <View style={styles.screen}>
      {soundscape.artwork_url ? (
        <Image
          contentFit="cover"
          cachePolicy="memory-disk"
          source={{ uri: soundscape.artwork_url }}
          style={StyleSheet.absoluteFill}
          transition={260}
        />
      ) : null}
      <LinearGradient
        colors={['rgba(11,11,13,0.72)', 'rgba(11,11,13,0.86)', 'rgba(8,8,10,0.97)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Minimise player"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.textPrimary} name="chevron-down" size={22} />
          </Pressable>

          <View style={styles.topBarRight}>
            <Pressable
              accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => toggleFavourite(soundscape, isFavourite)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons
                color={isFavourite ? HalcyonColors.accent : HalcyonColors.textPrimary}
                name={isFavourite ? 'heart' : 'heart-outline'}
                size={21}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="More options"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons color={HalcyonColors.textPrimary} name="ellipsis-horizontal" size={21} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>
          <View style={styles.artworkFrame}>
            {soundscape.artwork_url ? (
              <Image
                contentFit="cover"
                cachePolicy="memory-disk"
                source={{ uri: soundscape.artwork_url }}
                style={styles.artwork}
                transition={260}
              />
            ) : (
              <View style={[styles.artwork, styles.artworkFallback]} />
            )}
          </View>

          <View style={styles.copy}>
            <Text numberOfLines={2} style={styles.title}>
              {soundscape.title}
            </Text>
            {!!meta && <Text style={styles.meta}>{meta}</Text>}
            {!!error && <Text style={styles.error}>{error}</Text>}
            {canRetry && (
              <Pressable
                accessibilityLabel="Try playing again"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => void togglePlayPause()}
                style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                <Ionicons color={HalcyonColors.accent} name="refresh" size={14} />
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.progressBlock}>
            <Slider
              maximumTrackTintColor="rgba(255,255,255,0.16)"
              maximumValue={Math.max(total, 1)}
              minimumTrackTintColor={HalcyonColors.accent}
              minimumValue={0}
              onSlidingComplete={(value) => {
                setScrubValue(null);
                void seek(value);
              }}
              onSlidingStart={() => setScrubValue(sliderValue)}
              onValueChange={(value) => setScrubValue(value)}
              step={1}
              style={styles.slider}
              thumbTintColor={HalcyonColors.accent}
              value={sliderValue}
            />
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatClock(sliderValue)}</Text>
              <Text style={styles.time}>{total > 0 ? `-${formatClock(remaining)}` : ''}</Text>
            </View>
          </View>

          <View style={styles.transportRow}>
            <Pressable
              accessibilityLabel="Previous"
              accessibilityRole="button"
              accessibilityState={{ disabled: !hasPrevious }}
              disabled={!hasPrevious}
              hitSlop={10}
              onPress={() => void skipPrevious()}
              style={({ pressed }) => [
                styles.transportButton,
                !hasPrevious && styles.transportButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Ionicons
                color={hasPrevious ? HalcyonColors.textPrimary : HalcyonColors.textSecondary}
                name="play-skip-back"
                size={26}
              />
            </Pressable>

            <Pressable
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityRole="button"
              onPress={() => void togglePlayPause()}
              style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}>
              {isBuffering && !isPlaying ? (
                <ActivityIndicator color={HalcyonColors.background} />
              ) : (
                <Ionicons
                  color={HalcyonColors.background}
                  name={isPlaying ? 'pause' : 'play'}
                  size={34}
                  style={isPlaying ? undefined : styles.playIcon}
                />
              )}
            </Pressable>

            <Pressable
              accessibilityLabel="Next"
              accessibilityRole="button"
              accessibilityState={{ disabled: !hasNext }}
              disabled={!hasNext}
              hitSlop={10}
              onPress={() => void skipNext()}
              style={({ pressed }) => [
                styles.transportButton,
                !hasNext && styles.transportButtonDisabled,
                pressed && styles.pressed,
              ]}>
              <Ionicons
                color={hasNext ? HalcyonColors.textPrimary : HalcyonColors.textSecondary}
                name="play-skip-forward"
                size={26}
              />
            </Pressable>
          </View>

          {(timerSelection !== null || isFadingOut) && (
            <View style={styles.timerPill}>
              <Ionicons color={HalcyonColors.accent} name="moon-outline" size={14} />
              <Text style={styles.timerPillLabel}>
                {isFadingOut
                  ? 'Fading out'
                  : timerSelection === UNTIL_I_STOP || timerRemainingSeconds === null
                    ? formatTimerLabel(timerSelection)
                    : `${formatClock(timerRemainingSeconds)} left`}
              </Text>
            </View>
          )}

          <View style={styles.actionRow}>
            <ActionButton
              icon="timer-outline"
              label="Timer"
              active={timerSelection !== null}
              onPress={() => setTimerVisible(true)}
            />
            <ActionButton
              busy={downloadInFlight}
              icon={isDownloaded ? 'checkmark-circle-outline' : 'download-outline'}
              label={isDownloaded ? 'Saved' : 'Download'}
              active={isDownloaded}
              onPress={() => void handleDownload()}
            />
            <ActionButton
              icon="list-outline"
              label="Playlist"
              onPress={() => setPlaylistSheetVisible(true)}
            />
            <ActionButton icon="share-outline" label="Share" onPress={() => void handleShare()} />
          </View>

          <View style={styles.outputSection}>
            <View style={styles.outputRow}>
              <Ionicons color={HalcyonColors.textSecondary} name="volume-medium-outline" size={15} />
              <Text style={styles.outputLabel}>Playing on this device</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <TimerSheet
        endToneEnabled={endToneEnabled}
        mode={soundscape.mode}
        onClose={() => setTimerVisible(false)}
        onSelect={(selection) => {
          setTimer(selection);
          setTimerVisible(false);
        }}
        onToggleEndTone={setEndToneEnabled}
        selection={timerSelection}
        visible={timerVisible}
      />

      <Modal
        animationType="fade"
        navigationBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
        transparent
        visible={menuVisible}>
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setMenuVisible(false)}
          style={styles.menuBackdrop}
        />
        <View style={[styles.menu, { paddingBottom: insets.bottom + 20 }]}>
          <MenuRow
            icon="information-circle-outline"
            label="View details"
            onPress={() => {
              setMenuVisible(false);
              router.push(`/soundscape/${soundscape.id}` as Href);
            }}
          />
          <MenuRow
            icon="share-outline"
            label="Share"
            onPress={() => {
              setMenuVisible(false);
              void handleShare();
            }}
          />
          <MenuRow
            icon="list-outline"
            label="Add to playlist"
            onPress={() => {
              setMenuVisible(false);
              setPlaylistSheetVisible(true);
            }}
          />
          <MenuRow
            icon="alert-circle-outline"
            label="Report a problem"
            onPress={() => {
              setMenuVisible(false);
              router.push(`/profile/report-problem?soundscapeId=${soundscape.id}` as Href);
            }}
          />
        </View>
      </Modal>

      <PlaylistPickerSheet
        onClose={() => setPlaylistSheetVisible(false)}
        onDone={showToast}
        soundscape={soundscape}
        visible={playlistSheetVisible}
      />

      <Toast bottom={insets.bottom + 28} notice={notice} />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  active,
  busy,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
      {busy ? (
        <ActivityIndicator color={HalcyonColors.accent} size="small" />
      ) : (
        <Ionicons
          color={active ? HalcyonColors.accent : HalcyonColors.textPrimary}
          name={icon}
          size={20}
        />
      )}
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <Ionicons color={HalcyonColors.textPrimary} name={icon} size={19} />
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  pressed: {
    opacity: 0.76,
  },
  emptyScreen: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  emptyTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  emptyBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyButton: {
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyButtonLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 6,
  },
  topBarRight: {
    columnGap: 6,
    flexDirection: 'row',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 20,
  },
  artworkFrame: {
    alignSelf: 'center',
    aspectRatio: 1,
    borderColor: HalcyonColors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 26,
    maxWidth: 340,
    overflow: 'hidden',
    width: '86%',
  },
  artwork: {
    height: '100%',
    width: '100%',
  },
  artworkFallback: {
    backgroundColor: HalcyonColors.surfaceRaised,
  },
  copy: {
    marginBottom: 14,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 38,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  error: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  retryLabel: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  progressBlock: {
    marginBottom: 6,
  },
  slider: {
    height: 36,
    width: '100%',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  time: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  transportRow: {
    alignItems: 'center',
    columnGap: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 14,
  },
  transportButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  transportButtonDisabled: {
    opacity: 0.35,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  playButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  playIcon: {
    marginLeft: 4,
  },
  timerPill: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 7,
    flexDirection: 'row',
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  timerPillLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
    rowGap: 6,
  },
  actionLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
  },
  actionLabelActive: {
    color: HalcyonColors.accent,
  },
  outputSection: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingTop: 32,
  },
  outputRow: {
    alignItems: 'center',
    columnGap: 7,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  outputLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  menuBackdrop: {
    backgroundColor: HalcyonModal.backdrop,
    flex: 1,
  },
  menu: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: HalcyonRadius.sheet,
    borderTopRightRadius: HalcyonRadius.sheet,
    borderTopWidth: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 12,
  },
  menuRow: {
    alignItems: 'center',
    columnGap: 14,
    flexDirection: 'row',
    minHeight: 54,
  },
  menuLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
});
