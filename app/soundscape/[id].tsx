import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type TextLayoutEventData,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/CoverImage';
import { OnboardingBackButton } from '@/components/onboarding/OnboardingBackButton';
import { PlaylistPickerSheet } from '@/components/PlaylistPickerSheet';
import { SectionRail } from '@/components/SectionRail';
import { SoundscapeCard } from '@/components/SoundscapeCard';
import { Toast, useToast } from '@/components/Toast';
import { PassageColors, PassageRadius, PassageSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useSimilarSoundscapes } from '@/hooks/useCatalogue';
import { useIsFavourite, useToggleFavourite } from '@/hooks/useFavourites';
import { useSoundscape } from '@/hooks/useHome';
import type { Soundscape } from '@/lib/api/home';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

export default function SoundscapeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [playlistSheetVisible, setPlaylistSheetVisible] = useState(false);
  const { notice, showToast } = useToast();

  const { data: soundscape, isInitialLoading, isError, error, refetch, isRefetching } =
    useSoundscape(id);
  const playButtonColour = soundscape?.colour || PassageColors.accent;
  const similar = useSimilarSoundscapes(soundscape?.id);

  const isFavourite = useIsFavourite(id);
  const { toggleFavourite } = useToggleFavourite();
  const { playSoundscape } = usePlayerActions();
  const playNavigationRequest = useRef(0);
  useFocusEffect(useCallback(() => () => { playNavigationRequest.current += 1; }, []));

  const openSoundscape = useCallback(
    (item: Soundscape) => router.push(`/soundscape/${item.id}` as Href),
    [router]
  );

  const handlePlay = useCallback(async () => {
    if (!soundscape) return;
    const request = ++playNavigationRequest.current;
    await playSoundscape(soundscape);
    if (request !== playNavigationRequest.current) return;
    router.push('/player');
  }, [playSoundscape, router, soundscape]);

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

    const detailDescription =
      soundscape.detail_description?.trim() || soundscape.one_line_description?.trim() || '';

    return (
      <>
        <View style={styles.artworkFrame}>
          <CoverImage size="md" style={styles.artwork} uri={soundscape.artwork_url} />
        </View>

        <Text style={styles.title}>{soundscape.title}</Text>

        <View style={styles.playRow}>
          <Pressable
            accessibilityLabel={`Play ${soundscape.title}`}
            accessibilityRole="button"
            onPress={() => void handlePlay()}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: playButtonColour },
              pressed && styles.playButtonPressed,
            ]}>
            <Ionicons
              color="#F6EFE6"
              name="play"
              size={20}
              style={styles.playIcon}
            />
            <Text style={styles.playLabel}>Play</Text>
          </Pressable>
        </View>

        {!!detailDescription && <EditorialDescription description={detailDescription} />}

        <View style={styles.actionRow}>
          <IconAction
            active={isFavourite}
            icon={isFavourite ? 'heart' : 'heart-outline'}
            label={isFavourite ? 'Saved' : 'Save'}
            onPress={() => toggleFavourite(soundscape, isFavourite)}
          />
          <IconAction
            icon="list-outline"
            label="Playlist"
            onPress={() => setPlaylistSheetVisible(true)}
          />
          <IconAction
            icon="alert-circle-outline"
            label="Report"
            onPress={() =>
              router.push(`/profile/report-problem?soundscapeId=${soundscape.id}` as Href)
            }
          />
        </View>
        <SectionRail<Soundscape>
          data={similar.data}
          isError={similar.isError}
          isLoading={similar.isInitialLoading}
          keyExtractor={(item, index) => item.id ?? `${index}`}
          renderItem={(item) => (
            <SoundscapeCard
              onPlay={(picked) => void playSoundscape(picked)}
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
              color={isFavourite ? PassageColors.accent : PassageColors.textPrimary}
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

function EditorialDescription({ description }: { description: string }) {
  const sentences = description.split(/(?<=[.!?])\s+/).filter(Boolean);
  const firstParagraph = sentences.slice(0, 2).join(' ');
  const secondParagraph = sentences.slice(2).join(' ');
  const firstLetter = firstParagraph.charAt(0);
  const openingWords = firstParagraph.slice(1).split(/\s+/).filter(Boolean);
  const initialLeadWordCount = Math.min(8, openingWords.length);
  const [leadWordCount, setLeadWordCount] = useState(initialLeadWordCount);
  const maximumLeadWordCount = useRef(openingWords.length);

  useEffect(() => {
    maximumLeadWordCount.current = openingWords.length;
    setLeadWordCount(initialLeadWordCount);
  }, [description, initialLeadWordCount, openingWords.length]);

  const handleLeadLayout = useCallback(
    (event: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lines = event.nativeEvent.lines;

      if (lines.length > 2 && leadWordCount > 1) {
        maximumLeadWordCount.current = Math.min(
          maximumLeadWordCount.current,
          leadWordCount - 1
        );
        setLeadWordCount((count) => Math.max(1, count - 1));
        return;
      }

      if (lines.length < 2 && leadWordCount < maximumLeadWordCount.current) {
        setLeadWordCount((count) => Math.min(maximumLeadWordCount.current, count + 1));
        return;
      }

      if (
        lines.length === 2 &&
        lines[1].width < lines[0].width * 0.65 &&
        leadWordCount < maximumLeadWordCount.current
      ) {
        setLeadWordCount((count) => Math.min(maximumLeadWordCount.current, count + 1));
      }
    },
    [leadWordCount]
  );

  const lead = openingWords.slice(0, leadWordCount).join(' ');
  const firstParagraphContinuation = openingWords.slice(leadWordCount).join(' ');

  return (
    <View
      accessibilityLabel={description}
      accessibilityRole="text"
      accessible
      style={styles.detailDescriptionBlock}>
      <View style={styles.descriptionOpening}>
        <Text accessible={false} style={styles.descriptionDropCap}>
          {firstLetter}
        </Text>
        <Text
          accessible={false}
          onTextLayout={handleLeadLayout}
          style={[styles.detailDescription, styles.descriptionLead]}>
          {lead}
        </Text>
      </View>
      {!!firstParagraphContinuation && (
        <Text accessible={false} style={styles.detailDescription}>
          {firstParagraphContinuation}
        </Text>
      )}
      {!!secondParagraph && (
        <Text
          accessible={false}
          style={[styles.detailDescription, styles.descriptionParagraphSpacing]}>
          {secondParagraph}
        </Text>
      )}
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
        <ActivityIndicator color={PassageColors.accent} size="small" />
      ) : (
        <Ionicons
          color={active ? PassageColors.accent : PassageColors.textPrimary}
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
      <View style={[styles.skeletonLine, styles.skeletonParagraph]} />
      <View style={[styles.skeletonLine, styles.skeletonParagraphShort]} />
      <View style={styles.skeletonActions} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PassageColors.background,
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
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: PassageColors.border,
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
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.card,
    borderWidth: 1,
    marginHorizontal: PassageSpacing.screenX,
    overflow: 'hidden',
  },
  artwork: {
    height: '100%',
    width: '100%',
  },
  artworkFallback: {
    backgroundColor: PassageColors.surfaceRaised,
  },
  title: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 38,
    marginTop: 22,
    paddingHorizontal: PassageSpacing.screenX,
  },
  detailDescriptionBlock: {
    marginTop: 26,
    paddingHorizontal: PassageSpacing.screenX,
  },
  detailDescription: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 20,
    letterSpacing: 0.1,
    lineHeight: 29,
  },
  descriptionDropCap: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 62,
    lineHeight: 59,
    marginRight: 8,
    marginTop: -3,
  },
  descriptionLead: {
    flex: 1,
  },
  descriptionOpening: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  descriptionParagraphSpacing: {
    marginTop: 16,
  },
  actionRow: {
    alignItems: 'center',
    columnGap: 24,
    flexDirection: 'row',
    marginTop: 28,
    paddingHorizontal: PassageSpacing.screenX,
  },
  playRow: {
    marginTop: 24,
    paddingHorizontal: PassageSpacing.screenX,
  },
  playButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    columnGap: 8,
    elevation: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    width: '100%',
  },
  playButtonPressed: {
    opacity: 0.84,
  },
  playIcon: {
    marginLeft: 2,
  },
  playLabel: {
    color: '#F6EFE6',
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
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 11,
    lineHeight: 15,
  },
  iconActionLabelActive: {
    color: PassageColors.accent,
  },
  stateBlock: {
    alignItems: 'flex-start',
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 60,
  },
  stateTitle: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
  },
  stateBody: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  retryButton: {
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    marginTop: 20,
    paddingHorizontal: 26,
    paddingVertical: 12,
  },
  retryLabel: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  skeletonBlock: {
    backgroundColor: PassageColors.skeleton,
    borderColor: 'transparent',
  },
  skeletonLine: {
    backgroundColor: PassageColors.skeleton,
    borderRadius: 6,
    marginHorizontal: PassageSpacing.screenX,
  },
  skeletonTitle: {
    height: 28,
    marginTop: 24,
    width: '68%',
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
    backgroundColor: PassageColors.skeleton,
    borderRadius: PassageRadius.pill,
    height: 52,
    marginHorizontal: PassageSpacing.screenX,
    marginTop: 26,
  },
});
