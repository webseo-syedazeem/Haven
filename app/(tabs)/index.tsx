import { useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionCard, COLLECTION_CARD_WIDTH } from '@/components/CollectionCard';
import { ContinueCard, ContinueCardSkeleton } from '@/components/ContinueCard';
import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer';
import { ModeCard, ModeCardSkeleton } from '@/components/ModeCard';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SectionRail } from '@/components/SectionRail';
import { SoundscapeCard } from '@/components/SoundscapeCard';
import { HALCYON_TAB_BAR_HEIGHT, HalcyonColors, HalcyonSpacing } from '@/constants/design';
import { MODES, type ModeConfig } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import {
  useContinueListening,
  useFavouriteSoundscapes,
  useNewToHalcyon,
  usePopularCollections,
  useRecentlyPlayed,
  useRecommended,
  useShortSessions,
} from '@/hooks/useHome';
import { useUser } from '@/hooks/useUser';
import type { Collection, Soundscape } from '@/lib/api/home';
import { usePlayerActions, usePlayerState } from '@/lib/player/PlayerProvider';
import { getFirstName } from '@/lib/api/user';
import { getTimeOfDay } from '@/lib/utils/greeting';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const { playSoundscape, resume } = usePlayerActions();
  const { soundscape: currentTrack, resumable } = usePlayerState();

  const userQuery = useUser();
  const me = userQuery.data;
  const firstName = getFirstName(me);
  const profileImageUrl = me?.profile?.profile_image_url ?? '';

  const continueListening = useContinueListening();
  const recommended = useRecommended();
  const recentlyPlayed = useRecentlyPlayed();
  const favourites = useFavouriteSoundscapes();
  const newToHalcyon = useNewToHalcyon();
  const shortSessions = useShortSessions();
  const popularCollections = usePopularCollections();

  const openSoundscape = useCallback(
    (soundscape: Soundscape) => router.push(`/soundscape/${soundscape.id}` as Href),
    [router]
  );

  const openMode = useCallback(
    (mode: ModeConfig) => router.push(`/mode/${mode.id}` as Href),
    [router]
  );


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        userQuery.refetch(),
        continueListening.refetch(),
        recommended.refetch(),
        recentlyPlayed.refetch(),
        favourites.refetch(),
        newToHalcyon.refetch(),
        shortSessions.refetch(),
        popularCollections.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    continueListening,
    favourites,
    newToHalcyon,
    popularCollections,
    recentlyPlayed,
    recommended,
    shortSessions,
    userQuery,
  ]);

  const apiContinueItem = continueListening.data;
  const isBootstrapping = userQuery.isInitialLoading;

  // Saved player state wins over the history rail: it is the position this
  // device actually stopped at.
  const continueEntry = resumable
    ? {
        soundscape: resumable.soundscape,
        positionSeconds: resumable.positionSeconds,
        durationSeconds: resumable.durationSeconds,
        // `resume` also restores the timer that was running when it was saved.
        play: resume,
      }
    : apiContinueItem?.soundscape
      ? {
          soundscape: apiContinueItem.soundscape,
          positionSeconds: apiContinueItem.position_seconds,
          durationSeconds: apiContinueItem.duration_seconds,
          play: () =>
            playSoundscape(apiContinueItem.soundscape!, {
              startAt: apiContinueItem.position_seconds,
            }),
        }
      : null;

  /** Cards play in the context of their own rail, so next/previous stay useful. */
  const renderCard = useCallback(
    (soundscape: Soundscape, queue: Soundscape[]) => (
      <SoundscapeCard
        onPlay={(picked) => void playSoundscape(picked, { queue })}
        onPress={openSoundscape}
        soundscape={soundscape}
      />
    ),
    [openSoundscape, playSoundscape]
  );
  const soundscapeKey = useCallback((item: Soundscape, index: number) => item.id ?? `${index}`, []);
  const bottomInset =
    insets.bottom + HALCYON_TAB_BAR_HEIGHT + (currentTrack ? MINI_PLAYER_HEIGHT : 0) + 36;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
          refreshControl={
            <RefreshControl
              colors={[HalcyonColors.accent]}
              onRefresh={onRefresh}
              refreshing={refreshing}
              tintColor={HalcyonColors.accent}
            />
          }
          showsVerticalScrollIndicator={false}>
          {/* Greeting */}
          <View style={styles.block}>
            <View style={styles.headerRow}>
              <View style={styles.greetingBlock}>
                <Text style={styles.greetingLine}>{`Good ${getTimeOfDay()},`}</Text>
                {isBootstrapping ? (
                  <View style={styles.greetingNameSkeleton} />
                ) : (
                  <Text numberOfLines={1} style={styles.greetingName}>
                    {firstName || 'there'}
                  </Text>
                )}
                <Text style={styles.subtitle}>Where would you like to go?</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Open profile"
                accessibilityRole="button"
                activeOpacity={0.86}
                onPress={() => router.push('/(tabs)/profile' as Href)}>
                <ProfileAvatar
                  iconColor={HalcyonColors.textSecondary}
                  imageUrl={profileImageUrl}
                  placeholderBackgroundColor={HalcyonColors.surface}
                  size={46}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Continue Listening — the whole section drops when there is nothing to resume */}
          {continueListening.isInitialLoading ? (
            <View style={[styles.block, styles.section]}>
              <Text style={styles.sectionTitle}>Continue Listening</Text>
              <ContinueCardSkeleton />
            </View>
          ) : continueEntry ? (
            <View style={[styles.block, styles.section]}>
              <Text style={styles.sectionTitle}>Continue Listening</Text>
              <ContinueCard
                durationSeconds={continueEntry.durationSeconds}
                onPlay={() => {
                  void continueEntry.play().then(() => router.push('/player'));
                }}
                onPress={openSoundscape}
                positionSeconds={continueEntry.positionSeconds}
                soundscape={continueEntry.soundscape}
              />
            </View>
          ) : null}

          {/* Choose your mode — always present, even on a brand new account */}
          <View style={[styles.block, styles.section]}>
            <Text style={styles.sectionTitle}>Choose your mode</Text>
            <View style={styles.modeStack}>
              {isBootstrapping
                ? MODES.map((mode) => <ModeCardSkeleton key={mode.id} />)
                : MODES.map((mode) => <ModeCard key={mode.id} mode={mode} onPress={openMode} />)}
            </View>
          </View>

          <SectionRail
            data={recommended.data}
            isError={recommended.isError}
            isLoading={recommended.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/explore' as Href)}
            renderItem={(soundscape) => renderCard(soundscape, recommended.data ?? [])}
            title="Recommended Now"
          />

          <SectionRail
            data={recentlyPlayed.data}
            isError={recentlyPlayed.isError}
            isLoading={recentlyPlayed.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/saved' as Href)}
            renderItem={(soundscape) => renderCard(soundscape, recentlyPlayed.data ?? [])}
            title="Recently Played"
          />

          <SectionRail
            data={favourites.soundscapes}
            isError={favourites.isError}
            isLoading={favourites.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/saved' as Href)}
            renderItem={(soundscape) => renderCard(soundscape, favourites.soundscapes)}
            title="Your Favourites"
          />

          <SectionRail
            data={newToHalcyon.data}
            isError={newToHalcyon.isError}
            isLoading={newToHalcyon.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/library' as Href)}
            renderItem={(soundscape) => renderCard(soundscape, newToHalcyon.data ?? [])}
            title="New to Passage"
          />

          <SectionRail
            data={shortSessions.data}
            isError={shortSessions.isError}
            isLoading={shortSessions.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/library' as Href)}
            renderItem={(soundscape) => renderCard(soundscape, shortSessions.data ?? [])}
            title="Short Sessions"
          />

          <SectionRail<Collection>
            data={popularCollections.data}
            isError={popularCollections.isError}
            isLoading={popularCollections.isInitialLoading}
            itemHeight={124}
            itemWidth={COLLECTION_CARD_WIDTH}
            keyExtractor={(collection, index) => collection.id ?? `${index}`}
            onSeeAll={() => router.push('/(tabs)/explore' as Href)}
            renderItem={(collection) => <CollectionCard collection={collection} />}
            title="Popular Collections"
            withCaptionSkeleton={false}
          />
        </ScrollView>
      </SafeAreaView>
    </View>
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
  content: {
    flexGrow: 1,
    paddingTop: 18,
  },
  block: {
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  section: {
    marginTop: HalcyonSpacing.section,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  greetingBlock: {
    flex: 1,
    paddingRight: 16,
  },
  greetingLine: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 34,
    lineHeight: 42,
  },
  greetingName: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.displayRegular,
    fontSize: 34,
    lineHeight: 42,
  },
  greetingNameSkeleton: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 6,
    height: 26,
    marginTop: 8,
    maxWidth: 180,
  },
  subtitle: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  sectionTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 14,
  },
  modeStack: {
    rowGap: 14,
  },
});
