import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLLECTION_CARD_HEIGHT, COLLECTION_CARD_WIDTH } from '@/components/CollectionCard';
import { CoverImage } from '@/components/CoverImage';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { FilterChip } from '@/components/FilterChip';
import {
  PassageCardGradient,
  PassageCardGradientLocations,
  PassageColors,
  PassageRadius,
  PassageSpacing,
  Typography,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { EXPLORE_GROUP_TITLES, useExploreGroups } from '@/hooks/useExplore';
import type { ExploreGroupKey } from '@/lib/api/catalogue';
import type { Collection } from '@/lib/api/home';

const EXPLORE_BACKGROUND = require('@/assets/images/home-sat-night-pine-trail-v1.webp');
const EXPLORE_BACKGROUND_ASPECT_RATIO = 940 / 1672;

const CARD_GAP = PassageSpacing.card;
const CARD_WIDTH = COLLECTION_CARD_WIDTH;
const CARD_HEIGHT = COLLECTION_CARD_HEIGHT;
const WIDE_CARD_HEIGHT = 150;
const CHIP_ACTIVE = '#E8CFA6';

type TabKey = 'all' | ExploreGroupKey;

/** Short chip labels; the section headings keep their longer titles. */
const EXPLORE_TAB_LABELS: Partial<Record<ExploreGroupKey, string>> = {
  situation: 'Situation',
  editorial: 'Editorial',
};

const tabLabel = (key: TabKey) =>
  key === 'all' ? 'All' : (EXPLORE_TAB_LABELS[key] ?? EXPLORE_GROUP_TITLES[key] ?? key);

const sectionLabel = (key: ExploreGroupKey) => EXPLORE_GROUP_TITLES[key] ?? key;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabContentInset();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('all');

  const exploreQuery = useExploreGroups();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await exploreQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [exploreQuery]);

  const openCollection = useCallback(
    (collection: Collection) => router.push(`/collection/${collection.id}` as Href),
    [router]
  );

  // Only groups that currently hold collections in the database get a tab.
  const groups = useMemo(
    () => (exploreQuery.data ?? []).filter((group) => group.collections.length > 0),
    [exploreQuery.data]
  );
  const tabs = useMemo<TabKey[]>(() => ['all', ...groups.map((group) => group.group)], [groups]);
  const selectedTab: TabKey = tabs.includes(activeTab) ? activeTab : 'all';
  const visibleGroups =
    selectedTab === 'all' ? groups : groups.filter((group) => group.group === selectedTab);

  const featured =
    groups.find((group) => group.group === 'editorial')?.collections[0] ??
    groups[0]?.collections[0] ??
    null;

  const backgroundHeight = width / EXPLORE_BACKGROUND_ASPECT_RATIO;
  const isEmpty =
    !exploreQuery.isInitialLoading && !exploreQuery.isError && groups.length === 0;

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
            colors={[PassageColors.accent]}
            onRefresh={onRefresh}
            progressViewOffset={insets.top}
            refreshing={refreshing}
            tintColor={PassageColors.accent}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <View style={styles.scrollScene}>
          <View pointerEvents="none" style={[styles.backgroundImage, { height: backgroundHeight, width }]}>
            <Image
              contentFit="cover"
              contentPosition="top center"
              source={EXPLORE_BACKGROUND}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(4, 8, 12, 0.18)', 'rgba(5, 8, 11, 0.55)', 'rgba(8, 9, 11, 0.94)', '#0B0B0D']}
              locations={[0, 0.4, 0.85, 1]}
              style={StyleSheet.absoluteFill}
            />
          </View>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.heading}>Explore</Text>
          <Pressable
            accessibilityLabel="Search soundscapes"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/(tabs)/library' as Href)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color="rgba(255, 255, 255, 0.85)" name="search-outline" size={20} />
          </Pressable>
        </View>

        {tabs.length > 1 && (
          <ScrollView
            contentContainerStyle={styles.chipRow}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}>
            {tabs.map((key) => (
              <FilterChip
                key={key}
                label={tabLabel(key)}
                onPress={() => setActiveTab(key)}
                selected={key === selectedTab}
              />
            ))}
          </ScrollView>
        )}
        </View>

        {exploreQuery.isInitialLoading ? (
          <ExploreSkeleton />
        ) : exploreQuery.isError && groups.length === 0 ? (
          <ErrorState onRetry={() => void exploreQuery.refetch()} />
        ) : isEmpty ? (
          <View style={styles.emptyContent}>
            <EmptyState
              icon="compass-outline"
              iconColor={PassageColors.textPrimary}
              message="Curated collections arrive as the catalogue fills out."
              title="Nothing to explore yet"
            />
          </View>
        ) : (
          <>
            {selectedTab === 'all' && !!featured && (
              <FeaturedCard collection={featured} onPress={openCollection} />
            )}

            {selectedTab === 'all'
              ? visibleGroups.map((group) => (
                  <View key={group.group} style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>{sectionLabel(group.group)}</Text>
                      <Pressable
                        accessibilityLabel={`See all ${sectionLabel(group.group)}`}
                        accessibilityRole="button"
                        hitSlop={10}
                        onPress={() => setActiveTab(group.group)}
                        style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
                        <Text style={styles.seeAllText}>See all</Text>
                        <Ionicons color={PassageColors.accent} name="chevron-forward" size={14} />
                      </Pressable>
                    </View>
                    <ScrollView
                      contentContainerStyle={styles.tileRow}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.horizontalScroll}>
                      {group.collections.map((collection) => (
                        <ExploreCard
                          collection={collection}
                          key={collection.id}
                          onPress={openCollection}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ))
              : visibleGroups.map((group) => (
                  <View key={group.group} style={styles.wideList}>
                    {group.collections.map((collection) => (
                      <ExploreCard
                        collection={collection}
                        key={collection.id}
                        onPress={openCollection}
                        wide
                      />
                    ))}
                  </View>
                ))}
          </>
        )}
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[styles.topOverlay, { height: insets.top, opacity: overlayOpacity }]}
      />
    </View>
  );
}

function SoundscapeCount({ count, large }: { count: number | null; large?: boolean }) {
  return (
    <View style={styles.countRow}>
      <View style={[styles.playCircle, large && styles.playCircleLarge]}>
        <Ionicons
          color={PassageColors.textPrimary}
          name="play"
          size={large ? 11 : 9}
          style={styles.playIcon}
        />
      </View>
      <Text numberOfLines={1} style={[styles.countText, large && styles.countTextLarge]}>
        {count === null ? 'Collection' : `${count} ${count === 1 ? 'soundscape' : 'soundscapes'}`}
      </Text>
    </View>
  );
}

function ArrowButton({ large }: { large?: boolean }) {
  return (
    <View style={[styles.arrow, large && styles.arrowLarge]}>
      <Ionicons color="#FFFFFF" name="chevron-forward" size={large ? 18 : 16} />
    </View>
  );
}

function ExploreCard({
  collection,
  onPress,
  wide,
}: {
  collection: Collection;
  onPress: (collection: Collection) => void;
  /** Full-width card, used when a single group is open. */
  wide?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={collection.title}
      accessibilityRole="button"
      onPress={() => onPress(collection)}
      style={({ pressed }) => [
        styles.card,
        wide ? styles.cardWide : { width: CARD_WIDTH },
        pressed && styles.pressed,
      ]}>
      <CoverImage size="md" style={StyleSheet.absoluteFill} uri={collection.cover_image_url} />
      <LinearGradient
        colors={PassageCardGradient as unknown as readonly [string, string, ...string[]]}
        locations={PassageCardGradientLocations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={[styles.cardTitle, wide && styles.cardTitleWide]}>
          {collection.title}
        </Text>
        <SoundscapeCount count={collection.soundscape_count ?? null} large={wide} />
      </View>
      <ArrowButton large={wide} />
    </Pressable>
  );
}

function FeaturedCard({
  collection,
  onPress,
}: {
  collection: Collection;
  onPress: (collection: Collection) => void;
}) {
  return (
    <Pressable
      accessibilityLabel={collection.title}
      accessibilityRole="button"
      onPress={() => onPress(collection)}
      style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
      <CoverImage size="md" style={StyleSheet.absoluteFill} uri={collection.cover_image_url} />
      <LinearGradient
        colors={PassageCardGradient as unknown as readonly [string, string, ...string[]]}
        locations={PassageCardGradientLocations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featuredCopy}>
        <View style={styles.featuredPill}>
          <Text style={styles.featuredEyebrow}>Featured</Text>
        </View>
        <Text numberOfLines={2} style={styles.featuredTitle}>
          {collection.title}
        </Text>
        {!!collection.description && (
          <Text numberOfLines={2} style={styles.featuredBody}>
            {collection.description}
          </Text>
        )}
        <SoundscapeCount count={collection.soundscape_count ?? null} large />
      </View>
      <ArrowButton large />
    </Pressable>
  );
}

function ExploreSkeleton() {
  return (
    <View>
      <View style={[styles.featured, styles.skeletonBlock]} />
      <View style={styles.section}>
        <View style={styles.skeletonHeading}>
          <View style={styles.skeletonLine} />
        </View>
        <View style={styles.tileRow}>
          {[0, 1].map((index) => (
            <View
              key={index}
              style={[styles.skeletonBlock, styles.gridSkeleton, { width: CARD_WIDTH }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: PassageColors.background,
    flex: 1,
  },
  scrollScene: {
    position: 'relative',
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
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: PassageSpacing.screenX,
  },
  heading: {
    ...Typography.screenHeading,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    flexGrow: 1,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  horizontalScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 8,
    marginTop: 18,
  },
  chipRow: {
    alignItems: 'center',
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingBottom: 4,
    paddingHorizontal: PassageSpacing.screenX,
  },
  section: {
    marginTop: PassageSpacing.section,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: PassageSpacing.screenX,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
  },
  seeAll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  seeAllText: {
    color: PassageColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  grid: {
    columnGap: CARD_GAP,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PassageSpacing.screenX,
    rowGap: CARD_GAP,
  },
  card: {
    backgroundColor: PassageColors.surface,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: PassageRadius.card,
    borderWidth: 1,
    height: CARD_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardWide: {
    height: WIDE_CARD_HEIGHT,
    width: '100%',
  },
  cardTitleWide: {
    fontSize: 24,
    lineHeight: 30,
  },
  wideList: {
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: PassageSpacing.card,
    rowGap: CARD_GAP,
  },
  tileRow: {
    columnGap: CARD_GAP,
    flexDirection: 'row',
    paddingHorizontal: PassageSpacing.screenX,
  },
  cardCopy: {
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingRight: 48,
  },
  cardTitle: {
    ...Typography.sectionHeading,
    fontSize: 20,
    lineHeight: 26,
  },
  countRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  playCircle: {
    alignItems: 'center',
    borderColor: PassageColors.accent,
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  playCircleLarge: {
    borderRadius: 13,
    height: 26,
    width: 26,
  },
  playIcon: {
    marginLeft: 2,
  },
  countText: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
  countTextLarge: {
    fontSize: 13,
    lineHeight: 18,
  },
  arrow: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 8, 10, 0.55)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 15,
    borderWidth: 1,
    bottom: 12,
    height: 30,
    justifyContent: 'center',
    position: 'absolute',
    right: 12,
    width: 30,
  },
  arrowLarge: {
    borderRadius: 18,
    bottom: 16,
    height: 36,
    right: 16,
    width: 36,
  },
  featured: {
    backgroundColor: PassageColors.surface,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: PassageRadius.card,
    borderWidth: 1,
    height: 232,
    justifyContent: 'flex-end',
    marginHorizontal: PassageSpacing.screenX,
    marginTop: 18,
    overflow: 'hidden',
  },
  featuredCopy: {
    padding: 18,
    paddingRight: 64,
  },
  featuredPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(195, 161, 122, 0.22)',
    borderColor: 'rgba(195, 161, 122, 0.55)',
    borderRadius: PassageRadius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  featuredEyebrow: {
    color: CHIP_ACTIVE,
    fontFamily: AppFonts.sansMedium,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.1,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    ...Typography.sectionHeading,
    marginTop: 8,
  },
  featuredBody: {
    ...Typography.muted,
    marginTop: 4,
  },
  skeletonBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'transparent',
  },
  gridSkeleton: {
    borderRadius: PassageRadius.card,
    height: CARD_HEIGHT,
  },
  skeletonLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    height: 20,
    maxWidth: '100%',
    width: 180,
  },
  skeletonHeading: {
    height: 34,
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: PassageSpacing.screenX,
  },
});
