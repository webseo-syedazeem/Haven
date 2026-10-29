import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Dimensions,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CollectionCard, COLLECTION_CARD_WIDTH } from '@/components/CollectionCard';
import { ContinueCard, ContinueCardSkeleton } from '@/components/ContinueCard';
import { MINI_PLAYER_HEIGHT } from '@/components/MiniPlayer';
import { ModeCard, ModeCardSkeleton } from '@/components/ModeCard';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { SectionRail } from '@/components/SectionRail';
import { SoundscapeCard } from '@/components/SoundscapeCard';
import { SHOW_DEV_HOME_SCENE_REVIEW_BUTTON } from '@/config/dev-flags';
import { HALCYON_TAB_BAR_HEIGHT, HalcyonColors, HalcyonSpacing, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { MODES, type ModeConfig } from '@/constants/modes';
import {
  useContinueListening,
  useFavouriteSoundscapes,
  useNewToHalcyon,
  usePopularCollections,
  useRecentlyPlayed,
  useRecommended,
  useShortSessions,
} from '@/hooks/useHome';
import { useGuestModeActive, useHasSession } from '@/hooks/useSession';
import { useUser } from '@/hooks/useUser';
import type { Collection, Soundscape } from '@/lib/api/home';
import { coverUrl } from '@/lib/image-url';
import { usePlayerActions, usePlayerState } from '@/lib/player/PlayerProvider';
import { getFirstName } from '@/lib/api/user';
import {
  getUkGreeting,
  getUkTimeOfDay,
  getUkWeekday,
  type TimeOfDay,
  type UkWeekday,
} from '@/lib/utils/greeting';

/**
 * First-load fix: as soon as each rail's data arrives, warm expo-image's cache with the exact
 * sm/md variant URLs those cards are about to request, so the fade-in on scroll-into-view is
 * near instant instead of racing a cold network fetch. Capped and deduplicated — this prefetch
 * fires once per data change and never blocks rendering (the rails render immediately either
 * way; this only pre-warms what the device fetches next).
 */
const HOME_PREFETCH_PER_RAIL = 6;
const HOME_PREFETCH_MAX_TOTAL = 24;

function prefetchHomeCovers(options: {
  continueSoundscape?: Soundscape | null;
  soundscapeRails: (Soundscape[] | undefined)[];
  collections?: Collection[];
}) {
  const seen = new Set<string>();
  const urls: string[] = [];

  const addUrl = (raw: string | null | undefined, size: 'sm' | 'md') => {
    if (urls.length >= HOME_PREFETCH_MAX_TOTAL) return;
    const url = coverUrl(raw, size);
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  if (options.continueSoundscape) addUrl(options.continueSoundscape.artwork_url, 'sm');

  for (const rail of options.soundscapeRails) {
    for (const item of (rail ?? []).slice(0, HOME_PREFETCH_PER_RAIL)) {
      addUrl(item.artwork_url, 'sm');
    }
  }

  // Popular Collections renders CollectionCard at the `md` size, so the prefetch must warm
  // that exact variant URL — prefetching `sm` here would never be reused by the real request.
  for (const collection of (options.collections ?? []).slice(0, HOME_PREFETCH_PER_RAIL)) {
    addUrl(collection.cover_image_url, 'md');
  }

  if (urls.length === 0) return;
  void ExpoImage.prefetch(urls, { cachePolicy: 'memory-disk' });
}

const HERO_BACKGROUNDS: Record<UkWeekday, Record<TimeOfDay, number>> = {
  monday: {
    morning: require('@/assets/images/home-mon-morning-coastal-cliff-v1.webp'),
    afternoon: require('@/assets/images/home-mon-afternoon-glasshouse-v1.webp'),
    evening: require('@/assets/images/home-mon-evening-viaduct-v1.webp'),
    night: require('@/assets/images/home-mon-night-rooftops-v1.webp'),
  },
  tuesday: {
    morning: require('@/assets/images/home-tue-morning-dew-meadow-v1.webp'),
    afternoon: require('@/assets/images/home-tue-afternoon-workshop-v1.webp'),
    evening: require('@/assets/images/home-tue-evening-canal-lock-v1.webp'),
    night: require('@/assets/images/home-tue-night-observatory-v1.webp'),
  },
  wednesday: {
    morning: require('@/assets/images/home-wed-morning-kitchen-tea-v1.webp'),
    afternoon: require('@/assets/images/home-wed-afternoon-sand-dunes-v1.webp'),
    evening: require('@/assets/images/home-wed-evening-harbour-v1.webp'),
    night: require('@/assets/images/home-wed-night-fireplace-library-v1.webp'),
  },
  thursday: {
    morning: require('@/assets/images/home-thu-morning-upland-tarn-v1.webp'),
    afternoon: require('@/assets/images/home-thu-afternoon-wheat-fields-v1.webp'),
    evening: require('@/assets/images/home-thu-evening-forest-stream-v1.webp'),
    night: require('@/assets/images/home-thu-night-sleeper-train-v1.webp'),
  },
  friday: {
    morning: require('@/assets/images/home-fri-morning-potting-greenhouse-v1.webp'),
    afternoon: require('@/assets/images/home-fri-afternoon-chalk-cliffs-v1.webp'),
    evening: require('@/assets/images/home-fri-evening-moor-shelter-v1.webp'),
    night: require('@/assets/images/home-fri-night-cobbled-lane-v1.webp'),
  },
  saturday: {
    morning: require('@/assets/images/home-sat-morning-reading-nook-v1.webp'),
    afternoon: require('@/assets/images/home-sat-afternoon-apple-orchard-v1.webp'),
    evening: require('@/assets/images/home-sat-evening-boathouse-v1.webp'),
    night: require('@/assets/images/home-sat-night-pine-trail-v1.webp'),
  },
  sunday: {
    morning: require('@/assets/images/home-sun-morning-sheep-pasture-v1.webp'),
    afternoon: require('@/assets/images/home-sun-afternoon-abbey-garden-v1.webp'),
    evening: require('@/assets/images/home-sun-evening-highland-road-v1.webp'),
    night: require('@/assets/images/home-sun-night-music-room-v1.webp'),
  },
};
const brandIcon = require('@/assets/images/passage-brand-assets/screens-icon.webp');
const HERO_BACKGROUND_ASPECT_RATIO = 940 / 1672;
const HOME_SCENE_REVIEW_ORDER: readonly {
  timeOfDay: TimeOfDay;
  weekday: UkWeekday;
}[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
].flatMap((weekday) =>
  (['morning', 'afternoon', 'evening', 'night'] as const).map((timeOfDay) => ({
    timeOfDay,
    weekday: weekday as UkWeekday,
  }))
);

function getHomeTimeState() {
  const now = new Date();
  return {
    greeting: getUkGreeting(now),
    timeOfDay: getUkTimeOfDay(now),
    weekday: getUkWeekday(now),
  };
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [homeTime, setHomeTime] = useState(getHomeTimeState);
  const [sceneReviewIndex, setSceneReviewIndex] = useState<number | null>(null);
  const hasSession = useHasSession();
  const guestModeActive = useGuestModeActive();
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

  useEffect(() => {
    const syncWithLondonTime = () => setHomeTime(getHomeTimeState());
    const interval = setInterval(syncWithLondonTime, 60_000);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') syncWithLondonTime();
    });

    return () => {
      clearInterval(interval);
      appStateSubscription.remove();
    };
  }, []);

  const openSoundscape = useCallback(
    (soundscape: Soundscape) => router.push(`/soundscape/${soundscape.id}` as Href),
    [router]
  );

  const openMode = useCallback(
    (mode: ModeConfig) => router.push(`/mode/${mode.id}` as Href),
    [router]
  );

  const openCollection = useCallback(
    (collection: Collection) => router.push(`/collection/${collection.id}` as Href),
    [router]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const accountRefreshes = hasSession
        ? [
            userQuery.refetch(),
            continueListening.refetch(),
            recentlyPlayed.refetch(),
            favourites.refetch(),
          ]
        : [];
      const recommendationRefresh =
        hasSession || guestModeActive ? [recommended.refetch()] : [];

      await Promise.allSettled([
        ...accountRefreshes,
        ...recommendationRefresh,
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
    guestModeActive,
    hasSession,
    newToHalcyon,
    popularCollections,
    recentlyPlayed,
    recommended,
    shortSessions,
    userQuery,
  ]);

  const apiContinueItem = continueListening.data;
  const isBootstrapping = userQuery.isInitialLoading;

  // Fire-and-forget: warms the cache for whatever is about to render, without gating the
  // rails themselves (which already render immediately from their own loading states above).
  useEffect(() => {
    prefetchHomeCovers({
      continueSoundscape: resumable?.soundscape ?? apiContinueItem?.soundscape ?? null,
      soundscapeRails: [
        recommended.data,
        recentlyPlayed.data,
        favourites.soundscapes,
        newToHalcyon.data,
        shortSessions.data,
      ],
      collections: popularCollections.data,
    });
  }, [
    apiContinueItem?.soundscape,
    favourites.soundscapes,
    newToHalcyon.data,
    popularCollections.data,
    recentlyPlayed.data,
    recommended.data,
    resumable?.soundscape,
    shortSessions.data,
  ]);

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

  const renderCard = useCallback(
    (soundscape: Soundscape) => (
      <SoundscapeCard
        onPlay={(picked) => void playSoundscape(picked)}
        onPress={openSoundscape}
        soundscape={soundscape}
      />
    ),
    [openSoundscape, playSoundscape]
  );
  const soundscapeKey = useCallback((item: Soundscape, index: number) => item.id ?? `${index}`, []);
  const bottomInset =
    insets.bottom + HALCYON_TAB_BAR_HEIGHT + (currentTrack ? MINI_PLAYER_HEIGHT : 0) + 36;
  const backgroundHeight = screenWidth / HERO_BACKGROUND_ASPECT_RATIO;
  const reviewedScene = sceneReviewIndex === null
    ? null
    : HOME_SCENE_REVIEW_ORDER[sceneReviewIndex];
  const displayedHomeTime = reviewedScene
    ? {
        greeting: `Good ${reviewedScene.timeOfDay}`,
        ...reviewedScene,
      }
    : homeTime;
  const heroBackground =
    HERO_BACKGROUNDS[displayedHomeTime.weekday][displayedHomeTime.timeOfDay];

  const showNextReviewScene = () => {
    setSceneReviewIndex((current) =>
      current === null ? 0 : (current + 1) % HOME_SCENE_REVIEW_ORDER.length
    );
  };

  const scrollAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = scrollAnim.interpolate({
    inputRange: [0, 30],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.screen}>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            colors={[HalcyonColors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={HalcyonColors.accent}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        {/* Scroll scene: background + hero share a relative container so image scrolls with content */}
        <View style={styles.scrollScene}>
          <Image
            resizeMode="contain"
            source={heroBackground}
            style={[styles.backgroundImage, { width: screenWidth, height: backgroundHeight }]}
          />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.52)', 'rgba(0, 0, 0, 0.36)', 'rgba(0, 0, 0, 0.60)']}
            locations={[0, 0.42, 1]}
            pointerEvents="none"
            style={[styles.backgroundImage, { width: screenWidth, height: backgroundHeight }]}
          />
          {/* Hero Header — paddingTop pushes content below status bar */}
          <View style={[styles.hero, { paddingTop: insets.top + 14, minHeight: 260 + insets.top }]}>
            {/* Top bar: brand left, avatar right */}
            <View style={styles.heroTopRow}>
              <View style={styles.brand}>
                <Image source={brandIcon} style={styles.brandIcon} />
                <Text style={styles.brandText}>Passage</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Open profile"
                accessibilityRole="button"
                activeOpacity={0.86}
                onPress={() => router.push('/(tabs)/profile' as Href)}>
                <ProfileAvatar
                  iconColor="rgba(255,255,255,0.96)"
                  imageUrl={profileImageUrl}
                  placeholderBackgroundColor="rgba(255,255,255,0.18)"
                  size={40}
                  style={styles.heroAvatar}
                />
              </TouchableOpacity>
            </View>
            {/* Greeting + subtitle */}
            <View style={styles.heroBottom}>
              <Text style={styles.greetingLine}>{`${displayedHomeTime.greeting},`}</Text>
              {isBootstrapping ? (
                <View style={styles.greetingNameSkeleton} />
              ) : (
                <Text numberOfLines={1} style={styles.greetingName}>
                  {firstName || 'there'}
                </Text>
              )}
              <Text style={styles.subtitle}>Where would you like to go?</Text>
            </View>
          </View>
        </View>{/* end scrollScene */}

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

          <SectionRail
            data={recommended.data}
            emptyNote="We're adding more soundscapes soon — check back shortly."
            emptyTitle="Coming soon"
            isError={recommended.isError}
            isLoading={recommended.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/library' as Href)}
            renderItem={renderCard}
            title="Recommendation for you"
          />

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
            data={recentlyPlayed.data}
            emptyNote={
              hasSession
                ? 'The soundscapes you play will show up here.'
                : undefined
            }
            emptyTitle={hasSession ? 'Nothing played yet' : undefined}
            isError={recentlyPlayed.isError}
            isLoading={recentlyPlayed.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/saved?segment=recent' as Href)}
            renderItem={renderCard}
            title="Recently Played"
          />

          <SectionRail
            data={favourites.soundscapes}
            emptyNote={
              hasSession
                ? 'Tap the heart on any soundscape to save it here.'
                : undefined
            }
            emptyTitle={hasSession ? 'No favourites yet' : undefined}
            isError={favourites.isError}
            isLoading={favourites.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/saved' as Href)}
            renderItem={renderCard}
            title="Your Favourites"
          />

          <SectionRail
            data={newToHalcyon.data}
            isError={newToHalcyon.isError}
            isLoading={newToHalcyon.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/library' as Href)}
            renderItem={renderCard}
            title="New to Passage"
          />

          <SectionRail
            data={shortSessions.data}
            isError={shortSessions.isError}
            isLoading={shortSessions.isInitialLoading}
            keyExtractor={soundscapeKey}
            onSeeAll={() => router.push('/(tabs)/library' as Href)}
            renderItem={renderCard}
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
            renderItem={(collection) => (
              <CollectionCard collection={collection} onPress={openCollection} />
            )}
            title="Popular Collections"
            withCaptionSkeleton={false}
          />
      </Animated.ScrollView>

      {/* Fixed top safe-area overlay: transparent at scrollY=0, fades to black as user scrolls */}
      <Animated.View
        pointerEvents="none"
        style={[styles.topOverlay, { height: insets.top, opacity: overlayOpacity }]}
      />
      {SHOW_DEV_HOME_SCENE_REVIEW_BUTTON ? (
        <TouchableOpacity
          accessibilityHint="Cycles through all 28 weekday and time-of-day Home backgrounds"
          accessibilityLabel="Show next Home scene"
          accessibilityRole="button"
          activeOpacity={0.82}
          onPress={showNextReviewScene}
          style={[
            styles.sceneReviewButton,
            {
              bottom:
                insets.bottom +
                HALCYON_TAB_BAR_HEIGHT +
                (currentTrack ? MINI_PLAYER_HEIGHT : 0) +
                12,
            },
          ]}>
          <Text style={styles.sceneReviewNext}>NEXT SCENE</Text>
          <Text style={styles.sceneReviewLabel}>
            {reviewedScene
              ? `${reviewedScene.weekday.slice(0, 3).toUpperCase()}  ${reviewedScene.timeOfDay
                  .slice(0, 2)
                  .toUpperCase()}  ${sceneReviewIndex! + 1}/28`
              : 'START  28'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Scale down font on narrow screens so "Good Afternoon," fits on one line
const GREETING_FONT_SIZE = SCREEN_WIDTH < 380 ? 30 : SCREEN_WIDTH < 430 ? 35 : 40;
const GREETING_LINE_HEIGHT = GREETING_FONT_SIZE * 1.15;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  scrollScene: {
    // relative wrapper — background image is absolute within this, so it scrolls with content
  },
  backgroundImage: {
    left: 0,
    position: 'absolute',
    top: 0,
  },
  topOverlay: {
    backgroundColor: '#000000',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sceneReviewButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(112, 76, 182, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 18,
    borderWidth: 1,
    elevation: 8,
    justifyContent: 'center',
    left: 16,
    minHeight: 52,
    paddingHorizontal: 13,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 9999,
  },
  sceneReviewLabel: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 10,
    letterSpacing: 0.5,
    lineHeight: 13,
  },
  sceneReviewNext: {
    color: 'rgba(255, 255, 255, 0.76)',
    fontFamily: AppFonts.sansBold,
    fontSize: 7,
    letterSpacing: 0.7,
    lineHeight: 10,
  },
  content: {
    flexGrow: 1,
  },
  block: {
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  section: {
    marginTop: HalcyonSpacing.section,
  },
  /* ── Hero header ───────────────────────────────────────── */
  hero: {
    justifyContent: 'space-between',
    paddingBottom: 28,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroAvatar: {
    borderColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    marginLeft: -11,
  },
  brandIcon: {
    height: 34,
    resizeMode: 'contain',
    width: 52,
  },
  brandText: {
    color: '#FFFFFF',
    fontFamily: AppFonts.sansBold,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginLeft: -11,
  },
  heroBottom: {
    marginTop: 16,
  },
  /* ── Greeting ──────────────────────────────────────────── */
  greetingLine: {
    ...Typography.screenHeading,
    fontSize: GREETING_FONT_SIZE,
    lineHeight: GREETING_LINE_HEIGHT,
  },
  greetingName: {
    ...Typography.screenHeading,
    color: HalcyonColors.accent,
    fontSize: GREETING_FONT_SIZE,
    lineHeight: GREETING_LINE_HEIGHT,
  },
  greetingNameSkeleton: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 6,
    height: 26,
    marginTop: 8,
    maxWidth: 180,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontFamily: AppFonts.sansRegular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  /* ── Sections ──────────────────────────────────────────── */
  sectionTitle: {
    ...Typography.sectionHeading,
    marginBottom: 14,
  },
  modeStack: {
    rowGap: 14,
  },
});
