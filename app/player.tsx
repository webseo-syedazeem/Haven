import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/CoverImage';
import { PlaylistPickerSheet } from '@/components/PlaylistPickerSheet';
import { TimerSheet } from '@/components/TimerSheet';
import { Toast, useToast } from '@/components/Toast';
import {
  PassageColors,
  PassageModal,
  PassageRadius,
  PassageSpacing,
} from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { formatTimerCountdown, formatTimerLabel, UNTIL_I_STOP } from '@/constants/timers';
import { AppFonts } from '@/constants/theme';
import { useIsFavourite, useToggleFavourite } from '@/hooks/useFavourites';
import { usePlayer } from '@/lib/player/PlayerProvider';
import { formatPlaybackClock } from '@/lib/utils/duration';

export default function PlayerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 740 || width < 360;
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
    loopEnabled,
    loopNotice,
    position,
    duration,
    timerRemainingSeconds,
    togglePlayPause,
    seek,
    skipNext,
    skipPrevious,
    setTimer,
    setLoopEnabled,
  } = usePlayer();

  const [scrubValue, setScrubValue] = useState<number | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [playlistSheetVisible, setPlaylistSheetVisible] = useState(false);

  const isFavourite = useIsFavourite(soundscape?.id);
  const { toggleFavourite } = useToggleFavourite();

  useEffect(() => {
    if (loopNotice) showToast(loopNotice.text);
  }, [loopNotice, showToast]);

  const toggleLoop = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLoopEnabled(!loopEnabled);
  };

  if (!soundscape) {
    return (
      <SafeAreaView style={[styles.screen, styles.emptyScreen]}>
        <Text style={styles.emptyTitle}>Nothing is playing</Text>
        <Text style={styles.emptyBody}>Choose a soundscape and it will appear here.</Text>
        <Pressable
          accessibilityLabel="Close player"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}>
          <Text style={styles.emptyButtonLabel}>Close</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const total = duration || soundscape.duration_seconds || 0;
  const sliderValue = scrubValue ?? Math.min(position, total || position);
  const modeLabel = getModeLabel(soundscape.mode);
  const hasTimerCountdown =
    timerSelection !== null &&
    timerSelection !== UNTIL_I_STOP &&
    timerRemainingSeconds !== null;
  const timerLoading = isBuffering && !isPlaying && hasTimerCountdown;
  const timerPaused = !isBuffering && !isPlaying && hasTimerCountdown;
  const timerLabel = timerLoading
    ? `Loading, ${formatTimerCountdown(timerRemainingSeconds)} left`
    : timerPaused
      ? `Paused, ${formatTimerCountdown(timerRemainingSeconds)} left`
      : isFadingOut
        ? timerRemainingSeconds === null
          ? 'Fading out'
          : `Fading out, ${formatTimerCountdown(timerRemainingSeconds)} left`
        : timerSelection === null
          ? 'Off'
          : timerSelection === UNTIL_I_STOP || timerRemainingSeconds === null
            ? formatTimerLabel(timerSelection)
            : `${formatTimerCountdown(timerRemainingSeconds)} left`;

  return (
    <View style={styles.screen}>
      <CoverImage size="lg" style={StyleSheet.absoluteFill} uri={soundscape.artwork_url} />
      <LinearGradient
        colors={['rgba(3,10,18,0.25)', 'rgba(3,10,18,0.08)', 'rgba(3,10,18,0.78)', '#030A12']}
        locations={[0, 0.3, 0.62, 1]}
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
            <Ionicons color={PassageColors.textPrimary} name="chevron-down" size={28} />
          </Pressable>

          <View style={styles.topBarRight}>
            <Pressable
              accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => toggleFavourite(soundscape, isFavourite)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons
                color={isFavourite ? PassageColors.accent : PassageColors.textPrimary}
                name={isFavourite ? 'heart' : 'heart-outline'}
                size={26}
              />
            </Pressable>
            <Pressable
              accessibilityLabel="More options"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons color={PassageColors.textPrimary} name="ellipsis-horizontal" size={21} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 16 }]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>
          <View style={[styles.artworkSpace, { minHeight: compact ? 48 : 120 }]} />
          <View style={styles.controls}>
            <View style={styles.copy}>
              {!!modeLabel && <Text style={styles.category}>{modeLabel.toUpperCase()}</Text>}
              <Text style={[styles.title, compact && styles.titleCompact]}>
                {soundscape.title}
              </Text>
              {!!error && <Text style={styles.error}>{error}</Text>}
              {canRetry && (
                <Pressable
                  accessibilityLabel="Try playing again"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => void togglePlayPause()}
                  style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
                  <Ionicons color={PassageColors.accent} name="refresh" size={14} />
                  <Text style={styles.retryLabel}>Try again</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.progressBlock}>
              <Slider
                accessibilityLabel="Playback position"
                maximumTrackTintColor="rgba(245,239,228,0.3)"
                maximumValue={Math.max(total, 1)}
                minimumTrackTintColor={PLAYER_GOLD}
                minimumValue={0}
                onSlidingComplete={(value) => {
                  setScrubValue(null);
                  void seek(value);
                }}
                onSlidingStart={() => setScrubValue(sliderValue)}
                onValueChange={(value) => setScrubValue(value)}
                step={1}
                style={styles.slider}
                thumbTintColor={PLAYER_GOLD}
                value={sliderValue}
              />
              <View style={styles.timeRow}>
                <Text style={styles.time}>{formatPlaybackClock(sliderValue)}</Text>
                <Text style={styles.time}>{formatPlaybackClock(total)}</Text>
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
                  color={hasPrevious ? PassageColors.textPrimary : PassageColors.textSecondary}
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
                  <ActivityIndicator color={PassageColors.background} />
                ) : (
                  <Ionicons
                    color={PassageColors.background}
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
                  color={hasNext ? PassageColors.textPrimary : PassageColors.textSecondary}
                  name="play-skip-forward"
                  size={26}
                />
              </Pressable>
            </View>

            <View style={styles.actionRow}>
              <Pressable
                accessibilityLabel={`Timer, ${timerLabel}`}
                accessibilityRole="button"
                onPress={() => setTimerVisible(true)}
                style={({ pressed }) => [styles.settingPill, pressed && styles.pressed]}>
                <Ionicons color={PassageColors.textPrimary} name="stopwatch-outline" size={22} />
                <View style={styles.pillCopy}>
                  <Text numberOfLines={1} style={styles.pillLabel}>Timer</Text>
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
                    numberOfLines={1}
                    style={styles.pillDetail}>
                    {timerLabel}
                  </Text>
                </View>
                <Ionicons color={PassageColors.textSecondary} name="chevron-forward" size={16} />
              </Pressable>
              <Pressable
                accessibilityLabel="Continuous loop"
                accessibilityRole="switch"
                accessibilityState={{ checked: loopEnabled }}
                onPress={toggleLoop}
                style={({ pressed }) => [styles.settingPill, pressed && styles.pressed]}>
                <Ionicons color={PassageColors.textPrimary} name="repeat" size={22} />
                <View style={styles.pillCopy}>
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.82}
                    numberOfLines={1}
                    style={styles.pillLabel}>
                    Continuous loop
                  </Text>
                  <Text numberOfLines={1} style={styles.pillDetail}>
                    {loopEnabled ? 'On' : 'Off'}
                  </Text>
                </View>
                <View style={[styles.loopIndicator, loopEnabled && styles.loopIndicatorOn]} />
              </Pressable>
            </View>
            <Pressable
              accessibilityLabel="Playlist"
              accessibilityRole="button"
              onPress={() => setPlaylistSheetVisible(true)}
              style={({ pressed }) => [styles.playlistButton, pressed && styles.pressed]}>
              <Ionicons color={PassageColors.textPrimary} name="list-outline" size={26} />
              <Text style={styles.playlistLabel}>Playlist</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <TimerSheet
        isLoading={timerLoading}
        isPaused={timerPaused}
        mode={soundscape.mode}
        onClose={() => setTimerVisible(false)}
        onSelect={(selection) => {
          setTimer(selection);
          setTimerVisible(false);
        }}
        remainingSeconds={timerRemainingSeconds}
        selection={timerSelection}
        visible={timerVisible}
      />

      <Modal
        animationType="slide"
        navigationBarTranslucent
        onRequestClose={() => setMenuVisible(false)}
        statusBarTranslucent
        transparent
        visible={menuVisible}>
        <View style={styles.menuContainer}>
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
      <Ionicons color={PassageColors.textPrimary} name={icon} size={19} />
      <Text style={styles.menuLabel}>{label}</Text>
    </Pressable>
  );
}

const PLAYER_GOLD = '#E2BB88';

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PassageColors.background,
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
    paddingHorizontal: PassageSpacing.screenX,
  },
  emptyTitle: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
  },
  emptyBody: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyButton: {
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  emptyButtonLabel: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 6,
  },
  topBarRight: {
    columnGap: 6,
    flexDirection: 'row-reverse',
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
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 20,
  },
  artworkSpace: { flexGrow: 1 },
  controls: { alignSelf: 'center', maxWidth: 520, width: '100%' },
  copy: { alignItems: 'center', marginBottom: 12 },
  category: {
    color: '#D4D0C8', fontFamily: AppFonts.sansMedium, fontSize: 11,
    letterSpacing: 3.5, lineHeight: 18, marginBottom: 4, textAlign: 'center',
  },
  title: {
    color: '#F6F0E6', fontFamily: AppFonts.displayRegular,
    fontSize: 44, lineHeight: 46, textAlign: 'center',
  },
  titleCompact: { fontSize: 36, lineHeight: 38 },
  error: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderColor: PassageColors.accent,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  retryLabel: {
    color: PassageColors.accent,
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
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  transportRow: {
    alignItems: 'center',
    columnGap: 30,
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
    backgroundColor: PLAYER_GOLD,
    borderRadius: 42,
    height: 84,
    justifyContent: 'center',
    width: 84,
  },
  playButtonPressed: {
    backgroundColor: PassageColors.accentPressed,
  },
  playIcon: {
    marginLeft: 4,
  },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  settingPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    minHeight: 52, paddingHorizontal: 9, paddingVertical: 7,
    borderRadius: 32, borderWidth: 1, borderColor: 'rgba(240,232,217,0.26)',
    backgroundColor: 'rgba(7,16,24,0.32)',
  },
  pillCopy: { flex: 1, minWidth: 0 },
  pillLabel: {
    color: '#F6F0E6', fontFamily: AppFonts.sansRegular, fontSize: 11, lineHeight: 15,
  },
  pillDetail: {
    color: '#B7B6B4', fontFamily: AppFonts.sansRegular, fontSize: 10, lineHeight: 14,
  },
  loopIndicator: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(240,232,217,0.2)',
  },
  loopIndicatorOn: { backgroundColor: PLAYER_GOLD },
  playlistButton: {
    alignSelf: 'center', alignItems: 'center', gap: 4, marginTop: 22,
    paddingVertical: 8, paddingHorizontal: 20, minHeight: 48,
  },
  playlistLabel: {
    color: '#E6E0D6', fontFamily: AppFonts.sansRegular, fontSize: 13, lineHeight: 18,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PassageModal.backdrop,
  },
  menu: {
    backgroundColor: PassageColors.surface,
    borderTopColor: PassageColors.border,
    borderTopLeftRadius: PassageRadius.sheet,
    borderTopRightRadius: PassageRadius.sheet,
    borderTopWidth: 1,
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 12,
  },
  menuRow: {
    alignItems: 'center',
    columnGap: 14,
    flexDirection: 'row',
    minHeight: 54,
  },
  menuLabel: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
});
