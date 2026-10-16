import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
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

import {
  CollectionCard,
  COLLECTION_CARD_HEIGHT,
  COLLECTION_CARD_WIDTH,
} from '@/components/CollectionCard';
import { CoverImage } from '@/components/CoverImage';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import {
  HalcyonCardGradient,
  HalcyonCardGradientLocations,
  HalcyonColors,
  HalcyonRadius,
  HalcyonSpacing,
  Typography,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { EXPLORE_GROUP_TITLES, useExploreGroups } from '@/hooks/useExplore';
import type { Collection } from '@/lib/api/home';

const EXPLORE_BACKGROUND = require('@/assets/images/f96d5b3c-1856-4db7-ad2e-fcc7056d3aa1.webp');
const EXPLORE_BACKGROUND_ASPECT_RATIO = 941 / 1672;

const CARD_GAP = HalcyonSpacing.card;

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useTabContentInset();
  const { width } = useWindowDimensions();
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

  const groups = exploreQuery.data ?? [];

  const featured = groups.find((group) => group.group === 'editorial')?.collections[0]
    ?? groups[0]?.collections[0]
    ?? null;

  const situation = groups.find((group) => group.group === 'situation');
  const editorial = groups.find((group) => group.group === 'editorial');
  const remaining = groups.filter(
    (group) => group.group !== 'situation' && group.group !== 'editorial'
  );

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
            colors={[HalcyonColors.accent]}
            onRefresh={onRefresh}
            refreshing={refreshing}
            tintColor={HalcyonColors.accent}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}>
        <View style={styles.scrollScene}>
          <Image
            contentFit="cover"
            contentPosition="top center"
            pointerEvents="none"
            source={EXPLORE_BACKGROUND}
            style={[styles.backgroundImage, { height: backgroundHeight, width }]}
          />
          <LinearGradient
            colors={['rgba(2, 6, 10, 0.08)', 'rgba(2, 5, 8, 0.18)', 'rgba(0, 0, 0, 0.38)']}
            locations={[0, 0.42, 1]}
            pointerEvents="none"
            style={[styles.backgroundImage, { height: backgroundHeight, width }]}
          />
          <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.heading}>Explore</Text>
            <Pressable
              accessibilityLabel="Search soundscapes"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => router.push('/(tabs)/library' as Href)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons color="rgba(255, 255, 255, 0.7)" name="search-outline" size={21} />
            </Pressable>
          </View>
        </View>
          {exploreQuery.isInitialLoading ? (
            <ExploreSkeleton />
          ) : exploreQuery.isError && groups.length === 0 ? (
            <ErrorState onRetry={() => void exploreQuery.refetch()} />
          ) : isEmpty ? (
            <View style={styles.emptyContent}>
              <EmptyState
                icon="compass-outline"
                message="Curated collections arrive as the catalogue fills out."
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
                      <View key={collection.id} style={styles.railCard}>
                        <CollectionCard collection={collection} onPress={openCollection} />
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {!!editorial?.collections.length && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, styles.sectionTitleInset]}>
                    {EXPLORE_GROUP_TITLES.editorial}
                  </Text>
                  <ScrollView
                    contentContainerStyle={styles.tileRow}
                    horizontal
                    showsHorizontalScrollIndicator={false}>
                    {editorial.collections.map((collection) => (
                      <View key={collection.id} style={styles.railCard}>
                        <CollectionCard collection={collection} onPress={openCollection} />
                      </View>
                    ))}
                  </ScrollView>
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
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[styles.topOverlay, { height: insets.top, opacity: overlayOpacity }]}
      />
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
      <CoverImage size="md" style={StyleSheet.absoluteFill} uri={collection.cover_image_url} />
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

function ExploreSkeleton() {
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
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[styles.skeletonBlock, styles.gridSkeleton, { width: COLLECTION_CARD_WIDTH }]}
            />
          ))}
        </ScrollView>
      </View>
      <View style={styles.section}>
        <View style={styles.skeletonHeading}>
          <View style={styles.skeletonLine} />
        </View>
        <ScrollView
          contentContainerStyle={styles.tileRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[styles.skeletonBlock, styles.gridSkeleton, { width: COLLECTION_CARD_WIDTH }]}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
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
    paddingBottom: 16,
    paddingHorizontal: HalcyonSpacing.screenX,
  },
  heading: {
    ...Typography.screenHeading,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
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
  section: {
    marginTop: HalcyonSpacing.section,
  },
  sectionTitle: {
    ...Typography.sectionHeading,
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
    ...Typography.sectionHeading,
    marginTop: 6,
  },
  featuredBody: {
    ...Typography.muted,
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
  railCard: {
    width: COLLECTION_CARD_WIDTH,
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
