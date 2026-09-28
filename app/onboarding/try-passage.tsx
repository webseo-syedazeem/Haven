import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image as ArtworkImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { OnboardingContinueButton } from '@/components/onboarding/OnboardingContinueButton';
import { RelaxContinueButton } from '@/components/onboarding/RelaxContinueButton';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { RelaxStepHeader } from '@/components/onboarding/RelaxStepHeader';
import {
  HalcyonColors,
  ONBOARDING_MODE_ACCENTS,
  ONBOARDING_MODE_ACCENTS_PRESSED,
} from '@/constants/design';
import type { ModeId } from '@/constants/modes';
import { RELAX_ONBOARDING } from '@/constants/relax-onboarding';
import { AppFonts } from '@/constants/theme';
import { catalogueApi } from '@/lib/api/catalogue';
import type { Soundscape } from '@/lib/api/home';
import {
  finishOnboardingForAppEntry,
  getIncompleteOnboardingRoute,
  getOnboardingAnswers,
} from '@/lib/onboarding';
import { setIntroSeen } from '@/lib/auth/intro-flag';
import { hasActiveSession, isGuestModeActive } from '@/lib/auth/session-state';
import { resetToMainApp, safeGoBack } from '@/lib/navigation';
import { toPreviewTrack } from '@/lib/player/types';
import { useScopedPlayer } from '@/lib/player/useScopedPlayer';
import { formatClock } from '@/lib/utils/duration';

const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');

const PREVIEW_COUNT = 3;
const PREVIEW_DURATION_SECONDS = 60;
const EXPLORE_LABEL = 'EXPLORE ALL SOUNDSCAPES';
const HEADING_WORD_BY_MODE: Record<ModeId, string> = {
  focus: 'focus',
  relax: 'calm',
  sleep: 'sleep',
};

const WAVE_BAR_HEIGHTS = [
  4, 8, 14, 10, 18, 22, 16, 8, 12, 19, 24, 15, 9, 14, 20, 17, 11, 7, 13, 18, 12, 6, 10, 15, 8, 4,
];

// The bars keep the design's 1.5 : 1 bar-to-gap proportion but share out the
// whole row between them, so the waveform spans whatever width the card leaves.
const WAVE_BAR_UNITS = 1.5;
const WAVE_GAP_UNITS = 1;
const WAVE_TOTAL_UNITS =
  WAVE_BAR_HEIGHTS.length * WAVE_BAR_UNITS + (WAVE_BAR_HEIGHTS.length - 1) * WAVE_GAP_UNITS;
const WAVE_BAR_WIDTH = `${(WAVE_BAR_UNITS / WAVE_TOTAL_UNITS) * 100}%` as const;
const WAVE_GAP_WIDTH = `${(WAVE_GAP_UNITS / WAVE_TOTAL_UNITS) * 100}%` as const;

function Waveform({
  accentColor,
  active,
  progress,
}: {
  accentColor: string;
  active: boolean;
  progress: number;
}) {
  const total = WAVE_BAR_HEIGHTS.length;
  const filledCount = Math.floor(total * progress);

  return (
    <View style={styles.waveformContainer}>
      {WAVE_BAR_HEIGHTS.map((height, i) => {
        const isFilled = active && i < filledCount;
        return (
          <View
            key={i}
            style={[
              styles.waveBar,
              { height, marginLeft: i === 0 ? 0 : WAVE_GAP_WIDTH, width: WAVE_BAR_WIDTH },
              isFilled
                ? { backgroundColor: accentColor }
                : styles.waveBarDim,
            ]}
          />
        );
      })}
    </View>
  );
}

function SkeletonCard({ accentColor }: { accentColor: string }) {
  return (
    <View style={styles.card}>
      <View style={[styles.cardImage, styles.skeletonBlock]} />
      <View style={styles.cardRight}>
        <View style={[styles.skeletonBlock, styles.skeletonTitle]} />
        <View style={[styles.skeletonBlock, styles.skeletonTags]} />
        <View style={styles.playerRow}>
          <View style={[styles.playButton, styles.skeletonBlock]} />
          <Waveform accentColor={accentColor} active={false} progress={0} />
        </View>
      </View>
    </View>
  );
}

export default function TryPassageScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ModeId | null>(null);
  const [modeReady, setModeReady] = useState(false);
  const [enteringApp, setEnteringApp] = useState(false);
  const [entryError, setEntryError] = useState('');
  const player = useScopedPlayer();
  const resolvedMode: ModeId = mode ?? 'focus';
  const headingWord = HEADING_WORD_BY_MODE[resolvedMode];
  const accentColor = ONBOARDING_MODE_ACCENTS[resolvedMode];
  const accentPressedColor = ONBOARDING_MODE_ACCENTS_PRESSED[resolvedMode];

  const handleBack = () => {
    player.stop();
    safeGoBack(router);
  };

  useEffect(() => {
    let active = true;
    void getOnboardingAnswers()
      .then((answers) => {
        if (active) setMode(answers.mode ?? 'focus');
      })
      .catch(() => {
        if (active) setMode('focus');
      })
      .finally(() => {
        if (active) setModeReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const preview = useQuery({
    enabled: modeReady,
    queryKey: ['onboarding', 'preview', resolvedMode, PREVIEW_COUNT],
    queryFn: () => catalogueApi.preview(resolvedMode, PREVIEW_COUNT),
  });

  // A card that cannot play would only be a dead tap, so it is left out.
  const soundscapes = useMemo(
    () =>
      (preview.data ?? [])
        .filter((item) => item.id && toPreviewTrack(item))
        .slice(0, PREVIEW_COUNT),
    [preview.data]
  );

  // If a refetch replaces the list while a card is playing, that card is gone,
  // so stop rather than leave audio and a notification with nothing on screen.
  const { activeId, duration: activeClipDuration, stop: stopPreview } = player;
  useEffect(() => {
    if (activeId && !soundscapes.some((item) => item.id === activeId)) stopPreview();
  }, [activeId, soundscapes, stopPreview]);

  // Each clip's real length once it has loaded, so a card that has been
  // previewed keeps showing it after another card takes over.
  const [clipDurations, setClipDurations] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!activeId || activeClipDuration <= 0) return;
    setClipDurations((current) =>
      current[activeId] === activeClipDuration
        ? current
        : { ...current, [activeId]: activeClipDuration }
    );
  }, [activeId, activeClipDuration]);

  const enterApp = async () => {
    if (enteringApp || !modeReady) return;

    setEntryError('');
    setEnteringApp(true);
    player.stop();
    try {
      const answers = await getOnboardingAnswers();
      const incompleteRoute = getIncompleteOnboardingRoute(answers);
      if (incompleteRoute) {
        console.warn(
          '[onboarding] final action found incomplete local answers; returning to',
          incompleteRoute
        );
        setEntryError('Please complete the missing personalisation step.');
        setEnteringApp(false);
        router.replace(incompleteRoute);
        return;
      }

      await finishOnboardingForAppEntry();
      await setIntroSeen();
      if (hasActiveSession() || isGuestModeActive()) {
        // Signed in or already chosen as guest on the account screen, so there is
        // nothing left to choose.
        resetToMainApp(router);
      } else {
        // Reaching the end of onboarding is not consent to guest mode. The
        // account screen is the only place that offers that explicit choice.
        router.push('/welcome?from=explore');
      }
    } catch {
      setEntryError('We could not finish setting up Passage. Please try again.');
      setEnteringApp(false);
    }
  };

  const brandHeader = (
    <View style={styles.headerCentered}>
      <OnboardingBackButton onPress={handleBack} style={styles.headerBackButton} />
      <Image source={brandIcon} style={styles.brandIcon} />
      <Text style={styles.brandText}>Passage</Text>
    </View>
  );
  const customHeader =
    modeReady && resolvedMode === 'relax' ? (
      <RelaxStepHeader currentStep={10} onBack={handleBack} />
    ) : (
      brandHeader
    );

  const renderCard = (item: Soundscape) => {
    const isActive = player.activeId === item.id;
    const playing = isActive && player.isPlaying;
    // Every preview is presented as a one-minute sample immediately; once the
    // native source reports its real clip length, that value takes over.
    const total = isActive ? player.duration || PREVIEW_DURATION_SECONDS : 0;
    const progress = total > 0 ? Math.min(1, player.position / total) : 0;
    const listedDuration = clipDurations[item.id] ?? PREVIEW_DURATION_SECONDS;
    const artwork = item.artwork_url?.trim();

    return (
      <Pressable
        accessibilityLabel={`${playing ? 'Pause' : 'Play'} ${item.title}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
        key={item.id}
        onPress={() => void player.toggle(item)}
        style={[
          styles.card,
          isActive ? { borderColor: accentColor } : null,
        ]}>
        {artwork ? (
          <ArtworkImage
            cachePolicy="memory-disk"
            contentFit="cover"
            source={{ uri: artwork }}
            style={styles.cardImage}
          />
        ) : (
          <View style={[styles.cardImage, styles.skeletonBlock]} />
        )}

        <View style={styles.cardRight}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.short_title?.trim() || item.title}
          </Text>
          {item.one_line_description ? (
            <Text numberOfLines={1} style={styles.cardTags}>
              {item.one_line_description}
            </Text>
          ) : null}

          <View style={styles.playerRow}>
            <View
              style={[
                styles.playButton,
                isActive ? { backgroundColor: accentColor } : null,
              ]}>
              <Ionicons
                color={isActive ? '#0B0B0D' : '#FFFFFF'}
                name={playing ? 'pause' : 'play'}
                size={16}
                style={!playing ? styles.playIconOffset : undefined}
              />
            </View>

            <Waveform
              accentColor={accentColor}
              active={isActive}
              progress={progress}
            />

            <Text style={styles.timeText}>
              {isActive
                ? total > 0
                  ? `${formatClock(player.position)} / ${formatClock(total)}`
                  : formatClock(player.position)
                : listedDuration > 0
                  ? formatClock(listedDuration)
                  : ''}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderList = () => {
    // Cards already on screen win over a failed background refetch.
    if (soundscapes.length > 0) return soundscapes.map(renderCard);

    if (preview.isLoading) {
      return Array.from({ length: PREVIEW_COUNT }, (_, index) => (
        <SkeletonCard accentColor={accentColor} key={index} />
      ));
    }

    if (preview.isError) {
      return (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>We couldn&apos;t load the previews just now.</Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => void preview.refetch()}
            style={styles.retryButton}>
            <Text style={[styles.retryText, { color: accentColor }]}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.messageBox}>
        <Ionicons
          color={HalcyonColors.textSecondary}
          name="musical-notes-outline"
          size={25}
        />
        <Text style={styles.messageText}>Soundscapes are coming soon.</Text>
      </View>
    );
  };

  return (
    <OnboardingScaffold
      contentContainerStyle={[
        styles.content,
        resolvedMode === 'relax' && styles.relaxContent,
      ]}
      footer={
        <View style={styles.footerContainer}>
          {modeReady && resolvedMode === 'relax' ? (
            <RelaxContinueButton
              label={EXPLORE_LABEL}
              loading={enteringApp}
              onPress={() => void enterApp()}
            />
          ) : (
            <OnboardingContinueButton
              accentColor={accentColor}
              accentPressedColor={accentPressedColor}
              disabled={!modeReady}
              label={EXPLORE_LABEL}
              loading={enteringApp}
              onPress={() => void enterApp()}
              showArrow
            />
          )}
        </View>
      }
      header={customHeader}>
      {modeReady ? (
        <>
          <Text
            style={[
              styles.heading,
              resolvedMode === 'relax' && styles.relaxHeading,
            ]}>
            Hear where {headingWord}{'\n'}could take you.
          </Text>
          <Text
            style={[
              styles.subheading,
              resolvedMode === 'relax' && styles.relaxSubheading,
            ]}>
            Preview three one-minute soundscapes.
          </Text>

          <View
            style={[styles.list, resolvedMode === 'relax' && styles.relaxList]}>
            {renderList()}
          </View>
          {player.error ? (
            <Text style={styles.playbackError}>{player.error}</Text>
          ) : null}
          {entryError ? (
            <Text style={styles.playbackError}>{entryError}</Text>
          ) : null}
        </>
      ) : (
        <View style={styles.loadingMode}>
          <ActivityIndicator color={accentColor} size="small" />
          <Text style={styles.loadingModeText}>Preparing your previews...</Text>
        </View>
      )}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  brandIcon: {
    height: 22,
    resizeMode: 'contain',
    width: 38,
  },
  brandText: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansBold,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: 9,
  },
  card: {
    alignItems: 'center',
    backgroundColor: 'rgba(6,20,21,0.82)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 126,
    padding: 10,
  },
  cardImage: {
    borderRadius: 14,
    height: 104,
    width: 104,
  },
  cardRight: {
    flex: 1,
    marginLeft: 14,
    minWidth: 0,
  },
  cardTags: {
    color: 'rgba(255,255,255,0.66)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 19,
    marginTop: 3,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 23,
  },
  content: {
    paddingBottom: 24,
    paddingTop: 8,
  },
  footerContainer: {
    alignItems: 'center',
    width: '100%',
  },
  headerCentered: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingTop: 6,
    position: 'relative',
    width: '100%',
  },
  headerBackButton: {
    left: 20,
    position: 'absolute',
    top: 8,
  },
  heading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.playfairRegular,
    fontSize: 42,
    fontWeight: '400',
    letterSpacing: -0.55,
    lineHeight: 48,
    marginTop: 13,
    textAlign: 'center',
  },
  list: {
    gap: 14,
    marginTop: 18,
  },
  loadingMode: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 280,
  },
  loadingModeText: {
    color: '#8A8A8E',
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  messageBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(13,25,25,0.72)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    justifyContent: 'center',
    minHeight: 164,
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  messageText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  playIconOffset: {
    marginLeft: 2,
  },
  playbackError: {
    color: '#D9A39B',
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    textAlign: 'center',
  },
  playerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 11,
  },
  relaxContent: {
    paddingHorizontal: RELAX_ONBOARDING.screenPaddingHorizontal,
    paddingTop: RELAX_ONBOARDING.content.paddingTop,
  },
  relaxHeading: {
    fontSize: RELAX_ONBOARDING.heading.fontSize,
    letterSpacing: RELAX_ONBOARDING.heading.letterSpacing,
    lineHeight: RELAX_ONBOARDING.heading.lineHeight,
    marginTop: 0,
  },
  relaxList: {
    marginTop: RELAX_ONBOARDING.gaps.bodyToContent,
  },
  relaxSubheading: {
    fontSize: RELAX_ONBOARDING.body.fontSize,
    lineHeight: RELAX_ONBOARDING.body.lineHeight,
    marginTop: RELAX_ONBOARDING.gaps.headingToBody,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  retryText: {
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 14,
  },
  skeletonBlock: {
    backgroundColor: '#1A1F25',
  },
  skeletonTags: {
    borderRadius: 4,
    height: 10,
    marginTop: 8,
    width: '80%',
  },
  skeletonTitle: {
    borderRadius: 4,
    height: 14,
    width: '55%',
  },
  subheading: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansRegular,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
  timeText: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    minWidth: 54,
    flexShrink: 0,
    textAlign: 'right',
  },
  waveBar: {
    // Fully rounded ends at any width, as the original 1.5dp bars had.
    borderRadius: 999,
  },
  waveBarDim: {
    backgroundColor: 'rgba(255,255,255,0.48)',
  },
  waveformContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    height: 24,
    minWidth: 44,
  },
});
