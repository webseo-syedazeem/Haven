import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CollectionCard,
  COLLECTION_CARD_HEIGHT,
  COLLECTION_CARD_WIDTH,
} from '@/components/CollectionCard';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { FilterChip } from '@/components/FilterChip';
import {
  HalcyonCardGradient,
  HalcyonCardGradientLocations,
  HalcyonColors,
  HalcyonRadius,
  HalcyonSpacing,
} from '@/constants/design';
import { MODES, type ModeId } from '@/constants/modes';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { EXPLORE_GROUP_TITLES, useExploreGroups } from '@/hooks/useExplore';
import type { ExploreGroup } from '@/lib/api/catalogue';
import type { Collection } from '@/lib/api/home';

type QuickFilter = 'all' | ModeId | 'new';

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...MODES.map((mode) => ({ value: mode.id as QuickFilter, label: mode.label })),
  { value: 'new', label: 'New' },
];

const MAX_SITUATION_TILE = 116;
const SITUATION_COLUMNS = 4;
const CARD_GAP = HalcyonSpacing.card;
const NEW_WINDOW_DAYS = 30;

export default function ExploreScreen() {
  const router = useRouter();
  const bottomInset = useTabContentInset();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<QuickFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

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

  /**
   * `/api/explore` returns every published collection grouped by
   * `explore_group`; it takes no mode or recency parameter, so the quick
   * filters narrow the same payload here rather than re-querying.
   */
  const groups = useMemo<ExploreGroup[]>(() => {
    const all = exploreQuery.data ?? [];
    if (filter === 'all') return all;

    return all
      .map((group) => ({ ...group, collections: filterCollections(group.collections, filter) }))
      .filter((group) => group.collections.length > 0);
  }, [exploreQuery.data, filter]);

  const featured = groups.find((group) => group.group === 'editorial')?.collections[0]
    ?? groups[0]?.collections[0]
    ?? null;

  const situation = groups.find((group) => group.group === 'situation');
  const editorial = groups.find((group) => group.group === 'editorial');
  const remaining = groups.filter(
    (group) => group.group !== 'situation' && group.group !== 'editorial'
  );

  // Two-column grid, matching the screen gutters and the 14px rail gap.
  const contentWidth = width - HalcyonSpacing.screenX * 2;
  const gridWidth = (contentWidth - CARD_GAP) / 2;
  const situationWidth = Math.min(
    MAX_SITUATION_TILE,
    (contentWidth - CARD_GAP * (SITUATION_COLUMNS - 1)) / SITUATION_COLUMNS
  );
  const isEmpty =
    !exploreQuery.isInitialLoading && !exploreQuery.isError && groups.length === 0;

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.heading}>Explore</Text>
          <Pressable
            accessibilityLabel="Search soundscapes"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.push('/(tabs)/library' as Href)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.textPrimary} name="search-outline" size={21} />
          </Pressable>
        </View>

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
          <View>
            <ScrollView
              contentContainerStyle={styles.chipRow}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}>
              {QUICK_FILTERS.map((option) => (
                <FilterChip
                  key={option.value}
                  label={option.label}
                  onPress={() => setFilter(option.value)}
                  selected={filter === option.value}
                />
              ))}
            </ScrollView>
          </View>

          {exploreQuery.isInitialLoading ? (
            <ExploreSkeleton gridWidth={gridWidth} situationWidth={situationWidth} />
          ) : exploreQuery.isError && groups.length === 0 ? (
            <ErrorState onRetry={() => void exploreQuery.refetch()} />
          ) : isEmpty ? (
            <View style={styles.emptyContent}>
              <EmptyState
                actionLabel={filter === 'all' ? undefined : 'Show everything'}
                icon="compass-outline"
                message={
                  filter === 'all'
                    ? 'Curated collections arrive as the catalogue fills out.'
                    : 'Nothing in this filter yet.'
                }
                onAction={filter === 'all' ? undefined : () => setFilter('all')}
                title="Nothing to explore yet"
              />
            </View>
          ) : (
            <>
              {!!featured && <FeaturedCard collection={featured} onPress={openCollection} />}

              {!!situation?.collections.length && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{EXPLORE_GROUP_TITLES.situation}</Text>
                  <ScrollView
                    contentContainerStyle={styles.tileRow}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.horizontalScroll}>
                    {situation.collections.map((collection) => (
                      <SituationTile
                        collection={collection}
                        key={collection.id}
                        onPress={openCollection}
                        width={situationWidth}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              {!!editorial?.collections.length && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInset]}>
                    {EXPLORE_GROUP_TITLES.editorial}
                  </Text>
                  <View style={styles.grid}>
                    {editorial.collections.map((collection) => (
                      <CollectionCard
                        collection={collection}
                        key={collection.id}
                        onPress={openCollection}
                        width={gridWidth}
                      />
                    ))}
                  </View>
                </View>
              )}

              {remaining.map((group) => (
                <View key={group.group} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    {EXPLORE_GROUP_TITLES[group.group] ?? group.group}
                  </Text>
                  <ScrollView
                    contentContainerStyle={styles.tileRow}
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    {group.collections.map((collection) => (
                      <View key={collection.id} style={styles.railCard}>
                        <CollectionCard collection={collection} onPress={openCollection} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeaturedCard({
  collection,
  onPress,
}: {
  collection: Collection;
  onPress: (collection: Collection) => void;
}) {
  const count = collection.soundscape_count ?? null;

  return (
    <Pressable
      accessibilityLabel={collection.title}
      accessibilityRole="button"
      onPress={() => onPress(collection)}
      style={({ pressed }) => [styles.featured, pressed && styles.pressed]}>
      {collection.cover_image_url ? (
        <Image
          contentFit="cover"
          cachePolicy="memory-disk"
          source={{ uri: collection.cover_image_url }}
          style={StyleSheet.absoluteFill}
          transition={220}
        />
      ) : null}
      <LinearGradient
        colors={HalcyonCardGradient as unknown as readonly [string, string, ...string[]]}
        locations={HalcyonCardGradientLocations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.featuredCopy}>
        <Text style={styles.featuredEyebrow}>Featured</Text>
        <Text numberOfLines={2} style={styles.featuredTitle}>
          {collection.title}
        </Text>
        {!!collection.description && (
          <Text numberOfLines={2} style={styles.featuredBody}>
            {collection.description}
          </Text>
        )}
        {count !== null && (
          <Text style={styles.featuredMeta}>
            {count} {count === 1 ? 'soundscape' : 'soundscapes'}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function SituationTile({
  collection,
  onPress,
  width,
}: {
  collection: Collection;
  onPress: (collection: Collection) => void;
  width: number;
}) {
  return (
    <Pressable
      accessibilityLabel={collection.title}
      accessibilityRole="button"
      onPress={() => onPress(collection)}
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}>
      {collection.cover_image_url ? (
        <Image
          contentFit="cover"
          cachePolicy="memory-disk"
          source={{ uri: collection.cover_image_url }}
          style={StyleSheet.absoluteFill}
          transition={200}
        />
      ) : null}
      <LinearGradient
        colors={HalcyonCardGradient as unknown as readonly [string, string, ...string[]]}
        locations={HalcyonCardGradientLocations as unknown as readonly [number, number, ...number[]]}
        style={StyleSheet.absoluteFill}
      />
      <Text numberOfLines={2} style={styles.tileLabel}>
        {collection.title}
      </Text>
    </Pressable>
  );
}

function ExploreSkeleton({
  gridWidth,
  situationWidth,
}: {
  gridWidth: number;
  situationWidth: number;
}) {
  return (
    <View>
      <View style={[styles.featured, styles.skeletonBlock]} />
      <View style={styles.section}>
        <View style={styles.skeletonHeading}>
          <View style={styles.skeletonLine} />
        </View>
        <ScrollView
          contentContainerStyle={styles.tileRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}>
          {Array.from({ length: SITUATION_COLUMNS }, (_, index) => (
            <View
              key={index}
              style={[styles.tile, styles.skeletonBlock, { width: situationWidth }]}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.section}>
        <View style={styles.skeletonHeading}>
          <View style={styles.skeletonLine} />
        </View>
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[styles.skeletonBlock, styles.gridSkeleton, { width: gridWidth }]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

/**
 * Collections carry no mode column, so a mode chip matches on the text the API
 * does return. "New" leans on `created_at` when present and otherwise keeps the
 * API's own ordering, which is already sort_order then title.
 */
function filterCollections(collections: Collection[], filter: QuickFilter): Collection[] {
  if (filter === 'new') {
    const cutoff = Date.now() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const dated = collections.filter((collection) => {
      const createdAt = (collection as { created_at?: string }).created_at;
      return !!createdAt && new Date(createdAt).getTime() >= cutoff;
    });

    return dated.length > 0 ? dated : collections;
  }

  const needle = filter.toLowerCase();
  return collections.filter((collection) => {
    const haystack = [collection.title, collection.description, collection.slug]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 12,
  },
  heading: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displayRegular,
    fontSize: 34,
    lineHeight: 42,
  },
  iconButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
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
    paddingTop: 16,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chipRow: {
    alignItems: 'center',
    columnGap: 8,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingBottom: 4,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  horizontalScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  section: {
    marginTop: HalcyonSpacing.section,
  },
  sectionTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 14,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  sectionTitleInset: {
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  featured: {
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    height: 232,
    justifyContent: 'flex-end',
    marginHorizontal: HalcyonSpacing.screenX,
    marginTop: 18,
    overflow: 'hidden',
  },
  featuredCopy: {
    padding: 18,
  },
  featuredEyebrow: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.1,
    lineHeight: 15,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 33,
    marginTop: 6,
  },
  featuredBody: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  featuredMeta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 8,
  },
  tileRow: {
    alignItems: 'center',
    columnGap: CARD_GAP,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  tile: {
    aspectRatio: 1,
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.artwork,
    borderWidth: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 10,
  },
  tileLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 17,
  },
  railCard: {
    width: COLLECTION_CARD_WIDTH,
  },
  grid: {
    columnGap: CARD_GAP,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HalcyonSpacing.screenX,
    rowGap: 18,
  },
  skeletonBlock: {
    backgroundColor: HalcyonColors.surface,
    borderColor: 'transparent',
  },
  gridSkeleton: {
    borderRadius: HalcyonRadius.card,
    height: COLLECTION_CARD_HEIGHT,
  },
  skeletonLine: {
    backgroundColor: HalcyonColors.surface,
    borderRadius: 4,
    height: 20,
    maxWidth: '100%',
    width: 180,
  },
  skeletonHeading: {
    height: 28,
    justifyContent: 'center',
    marginBottom: 14,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
});
