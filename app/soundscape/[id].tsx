import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { PlaylistPickerSheet } from '@/components/PlaylistPickerSheet';
import { SectionRail } from '@/components/SectionRail';
import { SoundscapeCard } from '@/components/SoundscapeCard';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonRadius, HalcyonSpacing } from '@/constants/design';
import { getModeLabel } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { useSimilarSoundscapes } from '@/hooks/useCatalogue';
import {
  getDownloadBlockNotice,
  useDownloadSoundscape,
  useDownloadStatus,
} from '@/hooks/useDownloads';
import { useIsFavourite, useToggleFavourite } from '@/hooks/useFavourites';
import { useSoundscape } from '@/hooks/useHome';
import type { Soundscape } from '@/lib/api/home';
import { usePlayerActions } from '@/lib/player/PlayerProvider';
import { formatDuration } from '@/lib/utils/duration';

export default function SoundscapeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [playlistSheetVisible, setPlaylistSheetVisible] = useState(false);
  const { notice, showToast } = useToast();

  const { data: soundscape, isInitialLoading, isError, error, refetch, isRefetching } =
    useSoundscape(id);
  const similar = useSimilarSoundscapes(soundscape?.id);

  const isFavourite = useIsFavourite(id);
  const { toggleFavourite } = useToggleFavourite();
  const { playSoundscape } = usePlayerActions();
  const downloadState = useDownloadStatus(id);
  const { download, isDownloading } = useDownloadSoundscape();

  const openSoundscape = useCallback(
    (item: Soundscape) => router.push(`/soundscape/${item.id}` as Href),
    [router]
  );

  const handlePlay = useCallback(async () => {
    if (!soundscape) return;
    await playSoundscape(soundscape);
    router.push('/player');
  }, [playSoundscape, router, soundscape]);

  const handleShare = useCallback(async () => {
    if (!soundscape) return;
    try {
      await Share.share({
        message: `${soundscape.title} on Passage — ${Linking.createURL(`/soundscape/${soundscape.id}`)}`,
      });
    } catch {
      showToast('Could not open the share sheet.');
    }
  }, [showToast, soundscape]);

  const handleDownload = useCallback(async () => {
    if (!soundscape) return;
    if (downloadState?.status === 'completed') {
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
  }, [download, downloadState?.status, showToast, soundscape]);

  // A 404 from the API surfaces as an error; treat it as "not found" rather
  // than a connection problem so the copy matches what happened.
  const notFound =
    isError && /not found/i.test(error instanceof Error ? error.message : String(error ?? ''));

  const renderBody = () => {
    if (isInitialLoading) return <DetailSkeleton />;

    if (notFound || (!soundscape && !isError)) {
      return (
        <StateBlock
          body="It may have been retired, or the link is out of date."
          title="We can't find this soundscape."
        />
      );
    }

    if (isError || !soundscape) {
      return (
        <StateBlock
          body="Check your connection and try again."
          onRetry={() => void refetch()}
          retrying={isRefetching}
          title="We couldn't load this soundscape."
        />
      );
    }

    const modeLabel = getModeLabel(soundscape.mode);
    const durationLabel = formatDuration(soundscape.duration_seconds);
    const meta = [modeLabel, durationLabel].filter(Boolean).join(' · ');
    const contains = soundscape.contains?.filter(Boolean) ?? [];
    const doesNotContain = soundscape.does_not_contain?.filter(Boolean) ?? [];
    const soundSources = soundscape.sound_sources?.filter(Boolean) ?? [];
    const animals = soundscape.animals?.filter(Boolean) ?? [];
    const instruments = soundscape.instruments?.filter(Boolean) ?? [];
    const isDownloaded = downloadState?.status === 'completed';
    const downloadInFlight =
      isDownloading ||
      downloadState?.status === 'queued' ||
      downloadState?.status === 'downloading';

    const profileFacts: { label: string; value: string }[] = [];
    if (soundscape.detail_level) {
      profileFacts.push({ label: 'Detail', value: titleCase(soundscape.detail_level) });
    }
    if (typeof soundscape.intensity === 'number') {
      profileFacts.push({ label: 'Intensity', value: `${soundscape.intensity} of 5` });
    }
    if (soundscape.movement) {
      profileFacts.push({ label: 'Movement', value: titleCase(soundscape.movement) });
    }
    if (soundscape.perspective) {
      profileFacts.push({ label: 'Perspective', value: titleCase(soundscape.perspective) });
    }
    if (typeof soundscape.human_presence === 'boolean') {
      profileFacts.push({
        label: 'Human presence',
        value: soundscape.human_presence ? 'Present' : 'None',
      });
    }
    if (soundSources.length) {
      profileFacts.push({ label: 'Sound sources', value: soundSources.join(', ') });
    }
    if (animals.length) profileFacts.push({ label: 'Animals', value: animals.join(', ') });
    if (instruments.length) {
      profileFacts.push({ label: 'Instruments', value: instruments.join(', ') });
    }

    const productionFacts: { label: string; value: string }[] = [];
    if (durationLabel) productionFacts.push({ label: 'Master length', value: durationLabel });
    if (typeof soundscape.is_loop === 'boolean') {
      productionFacts.push({
        label: 'Loop',
        value: soundscape.is_loop ? 'Seamless loop' : 'Single pass',
      });
    }
    if (soundscape.qa_reviewer) {
      productionFacts.push({ label: 'QA reviewer', value: soundscape.qa_reviewer });
    }
    if (soundscape.qa_passed_at) {
      productionFacts.push({ label: 'QA passed', value: formatDate(soundscape.qa_passed_at) });
    }
    if (soundscape.rights_status) {
      productionFacts.push({ label: 'Rights', value: titleCase(soundscape.rights_status) });
    }
    if (soundscape.catalogue_ref) {
      productionFacts.push({ label: 'Catalogue ref', value: soundscape.catalogue_ref });
    }
    if (soundscape.file_size_bytes) {
      productionFacts.push({
        label: 'File size',
        value: formatBytes(soundscape.file_size_bytes),
      });
    }

    return (
      <>
        <View style={styles.artworkFrame}>
          {soundscape.artwork_url ? (
            <Image
              contentFit="cover"
              cachePolicy="memory-disk"
              source={{ uri: soundscape.artwork_url }}
              style={styles.artwork}
              transition={240}
            />
          ) : (
            <View style={[styles.artwork, styles.artworkFallback]} />
          )}
        </View>

        <Text style={styles.title}>{soundscape.title}</Text>
        {!!meta && <Text style={styles.meta}>{meta}</Text>}

        {!!soundscape.one_line_description && (
          <Text style={styles.description}>{soundscape.one_line_description}</Text>
        )}

        <View style={styles.actionRow}>
          <Pressable
            accessibilityLabel={`Play ${soundscape.title}`}
            accessibilityRole="button"
            onPress={() => void handlePlay()}
            style={({ pressed }) => [styles.playButton, pressed && styles.playButtonPressed]}>
            <Ionicons
              color={HalcyonColors.background}
              name="play"
              size={20}
              style={styles.playIcon}
            />
            <Text style={styles.playLabel}>Play</Text>
          </Pressable>

          <IconAction
            active={isFavourite}
            icon={isFavourite ? 'heart' : 'heart-outline'}
            label={isFavourite ? 'Saved' : 'Save'}
            onPress={() => toggleFavourite(soundscape, isFavourite)}
          />
          <IconAction
            active={isDownloaded}
            busy={downloadInFlight}
            icon={isDownloaded ? 'checkmark-circle-outline' : 'download-outline'}
            label={isDownloaded ? 'Saved' : 'Download'}
            onPress={() => void handleDownload()}
          />
          <IconAction
            icon="list-outline"
            label="Playlist"
            onPress={() => setPlaylistSheetVisible(true)}
          />
          <IconAction icon="share-outline" label="Share" onPress={() => void handleShare()} />
          <IconAction
            icon="alert-circle-outline"
            label="Report"
            onPress={() =>
              router.push(`/profile/report-problem?soundscapeId=${soundscape.id}` as Href)
            }
          />
        </View>

        {!!soundscape.designed_for && (
          <DetailSection title="Designed For">
            <Text style={styles.sectionBody}>{soundscape.designed_for}</Text>
          </DetailSection>
        )}

        {contains.length > 0 && (
          <DetailSection title="Contains">
            <View style={styles.chipWrap}>
              {contains.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipLabel}>{titleCase(item)}</Text>
                </View>
              ))}
            </View>
          </DetailSection>
        )}

        {doesNotContain.length > 0 && (
          <DetailSection title="Does Not Contain">
            <View style={styles.chipWrap}>
              {doesNotContain.map((item) => (
                <View key={item} style={[styles.chip, styles.chipExcluded]}>
                  <Ionicons
                    color={HalcyonColors.accent}
                    name="shield-checkmark-outline"
                    size={13}
                  />
                  <Text style={[styles.chipLabel, styles.chipLabelExcluded]}>
                    {titleCase(item)}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionNote}>
              Checked during review, so you know what you will not hear.
            </Text>
          </DetailSection>
        )}

        {profileFacts.length > 0 && (
          <DetailSection title="Sound Profile">
            {profileFacts.map((fact) => (
              <FactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </DetailSection>
        )}

        {!!soundscape.best_use && (
          <DetailSection title="Best Experienced">
            <Text style={styles.sectionBody}>{soundscape.best_use}</Text>
          </DetailSection>
        )}

        {productionFacts.length > 0 && (
          <DetailSection title="Production Information">
            {productionFacts.map((fact) => (
              <FactRow key={fact.label} label={fact.label} value={fact.value} />
            ))}
          </DetailSection>
        )}

        {!!soundscape.science_note && (
          <DetailSection title={soundscape.science_label?.trim() || 'Why this works'}>
            <Text style={styles.sectionBody}>{soundscape.science_note}</Text>
          </DetailSection>
        )}

        <SectionRail<Soundscape>
          data={similar.data}
          isError={similar.isError}
          isLoading={similar.isInitialLoading}
          keyExtractor={(item, index) => item.id ?? `${index}`}
          renderItem={(item) => (
            <SoundscapeCard
              onPlay={(picked) => void playSoundscape(picked, { queue: similar.data ?? [picked] })}
              onPress={openSoundscape}
              soundscape={item}
            />
          )}
          title="Similar Places"
        />
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <OnboardingBackButton onPress={() => router.back()} />
          <Pressable
            accessibilityLabel={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
            accessibilityRole="button"
            disabled={!soundscape}
            hitSlop={12}
            onPress={() => soundscape && toggleFavourite(soundscape, isFavourite)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons
              color={isFavourite ? HalcyonColors.accent : HalcyonColors.textPrimary}
              name={isFavourite ? 'heart' : 'heart-outline'}
              size={20}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}>
          {renderBody()}
        </ScrollView>
      </SafeAreaView>
      <PlaylistPickerSheet
        onClose={() => setPlaylistSheetVisible(false)}
        onDone={showToast}
        soundscape={soundscape ?? null}
        visible={playlistSheetVisible}
      />

      <Toast bottom={insets.bottom + 24} notice={notice} />
    </View>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function IconAction({
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
      style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}>
      {busy ? (
        <ActivityIndicator color={HalcyonColors.accent} size="small" />
      ) : (
        <Ionicons
          color={active ? HalcyonColors.accent : HalcyonColors.textPrimary}
          name={icon}
          size={20}
        />
      )}
      <Text style={[styles.iconActionLabel, active && styles.iconActionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function StateBlock({
  title,
  body,
  onRetry,
  retrying,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <View style={styles.stateBlock}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateBody}>{body}</Text>
      {!!onRetry && (
        <Pressable
          accessibilityLabel="Try again"
          accessibilityRole="button"
          disabled={retrying}
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
          <Text style={styles.retryLabel}>{retrying ? 'Loading…' : 'Try again'}</Text>
        </Pressable>
      )}
    </View>
  );
}

function DetailSkeleton() {
  return (
    <View>
      <View style={[styles.artworkFrame, styles.skeletonBlock]} />
      <View style={[styles.skeletonLine, styles.skeletonTitle]} />
      <View style={[styles.skeletonLine, styles.skeletonMeta]} />
      <View style={[styles.skeletonLine, styles.skeletonParagraph]} />
      <View style={[styles.skeletonLine, styles.skeletonParagraphShort]} />
      <View style={styles.skeletonActions} />
    </View>
  );
}

function titleCase(value: string) {
  const trimmed = value.trim().replace(/[_-]+/g, ' ');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    opacity: 0.78,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  content: {
    flexGrow: 1,
    paddingTop: 18,
  },
  artworkFrame: {
    aspectRatio: 0.92,
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    marginHorizontal: HalcyonSpacing.screenX,
    overflow: 'hidden',
  },
  artwork: {
    height: '100%',
    width: '100%',
  },
  artworkFallback: {
    backgroundColor: HalcyonColors.surfaceRaised,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 38,
    marginTop: 22,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  description: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 24,
    marginTop: 16,
    opacity: 0.9,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  actionRow: {
    alignItems: 'center',
    columnGap: 10,
    flexDirection: 'row',
    marginTop: 24,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  playButton: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    columnGap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 24,
  },
  playButtonPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  playIcon: {
    marginLeft: 2,
  },
  playLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  iconAction: {
    alignItems: 'center',
    flex: 1,
    rowGap: 5,
  },
  iconActionLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
  },
  iconActionLabelActive: {
    color: HalcyonColors.accent,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  sectionTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: 12,
  },
  sectionBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 22,
  },
  sectionNote: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 12,
    opacity: 0.85,
  },
  chipWrap: {
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 8,
  },
  chip: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 6,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipExcluded: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(195,161,122,0.38)',
  },
  chipLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  chipLabelExcluded: {
    color: HalcyonColors.accent,
  },
  factRow: {
    borderBottomColor: HalcyonColors.border,
    borderBottomWidth: 1,
    columnGap: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
  },
  factLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
  },
  factValue: {
    color: HalcyonColors.textPrimary,
    flexShrink: 1,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'right',
  },
  stateBlock: {
    alignItems: 'flex-start',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 60,
  },
  stateTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
  stateBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  retryButton: {
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  retryLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  skeletonBlock: {
    backgroundColor: HalcyonColors.skeleton,
    borderColor: 'transparent',
  },
  skeletonLine: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 6,
    marginHorizontal: HalcyonSpacing.screenX,
  },
  skeletonTitle: {
    height: 28,
    marginTop: 24,
    width: '68%',
  },
  skeletonMeta: {
    height: 12,
    marginTop: 10,
    width: '34%',
  },
  skeletonParagraph: {
    height: 12,
    marginTop: 20,
    width: '90%',
  },
  skeletonParagraphShort: {
    height: 12,
    marginTop: 10,
    width: '72%',
  },
  skeletonActions: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: HalcyonRadius.pill,
    height: 52,
    marginHorizontal: HalcyonSpacing.screenX,
    marginTop: 26,
  },
});
