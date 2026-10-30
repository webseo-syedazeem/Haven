import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CoverImage } from '@/components/CoverImage';
import { EmptyState, ErrorState } from '@/components/EmptyState';
import { SoundscapeRow, SoundscapeRowSkeletonList } from '@/components/SoundscapeRow';
import { Toast, useToast } from '@/components/Toast';
import {
  PassageCardGradient,
  PassageCardGradientLocations,
  PassageColors,
  PassageRadius,
  PassageSpacing,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';
import { useCollection } from '@/hooks/useExplore';
import { useFavouriteIds, useToggleFavourite } from '@/hooks/useFavourites';
import type { Soundscape } from '@/lib/api/home';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bottomInset = useBottomSafeSpacing();
  const { notice, showToast } = useToast();
  const { playSoundscape } = usePlayerActions();

  const collectionQuery = useCollection(id);
  const collection = collectionQuery.data;
  // Memoised so the play callback is not rebuilt on every render.
  const soundscapes = useMemo(() => collection?.soundscapes ?? [], [collection]);

  const favouriteIds = useFavouriteIds();
  const { toggleFavourite } = useToggleFavourite();

  const playAll = useCallback(async () => {
    const first = soundscapes.find((soundscape) => !!soundscape.file_url);
    if (!first) {
      showToast('Nothing in this collection can be played yet.');
      return;
    }
    await playSoundscape(first, { queue: soundscapes });
    router.push('/player');
  }, [playSoundscape, router, showToast, soundscapes]);

  const renderRow = useCallback(
    ({ item }: { item: Soundscape }) => (
      <SoundscapeRow
        isFavourite={favouriteIds.has(item.id)}
        onPlay={(picked) => void playSoundscape(picked)}
        onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
        onToggleFavourite={toggleFavourite}
        showFavourite
        soundscape={item}
        variant="saved"
      />
    ),
    [favouriteIds, playSoundscape, router, toggleFavourite]
  );

  return (
    <ImageBackground
      source={require('@/assets/images/auth-verified-clearing-realistic.webp')}
      style={styles.screen}
      resizeMode="cover">
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color="#FFFFFF" name="chevron-back" size={28} />
          </Pressable>
        </View>

        {collectionQuery.isInitialLoading ? (
          <>
            <View style={styles.heroSkeleton} />
            <SoundscapeRowSkeletonList />
          </>
        ) : collectionQuery.isError && !collection ? (
          <ErrorState onRetry={() => void collectionQuery.refetch()} />
        ) : !collection ? (
          <EmptyState
            actionLabel="Go back"
            icon="albums-outline"
            message="This collection may have been unpublished."
            onAction={() => router.back()}
            title="Collection not found"
          />
        ) : (
          <View style={styles.detailContent}>
            <View>
                <View style={styles.hero}>
                  <CoverImage size="md" style={StyleSheet.absoluteFill} uri={collection.cover_image_url} />
                  <LinearGradient
                    colors={PassageCardGradient as unknown as readonly [string, string, ...string[]]}
                    locations={
                      PassageCardGradientLocations as unknown as readonly [number, number, ...number[]]
                    }
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={styles.heroCopy}>
                    <Text style={styles.heroTitle}>{collection.title}</Text>
                    <Text style={styles.heroMeta}>
                      {soundscapes.length}{' '}
                      {soundscapes.length === 1 ? 'soundscape' : 'soundscapes'}
                    </Text>
                  </View>
                </View>

                {!!collection.description && (
                  <Text style={styles.description}>{collection.description}</Text>
                )}

                <View style={styles.actions}>
                  <Pressable
                    accessibilityLabel="Play all"
                    accessibilityRole="button"
                    disabled={soundscapes.length === 0}
                    onPress={playAll}
                    style={({ pressed }) => [
                      styles.playAll,
                      pressed && styles.playAllPressed,
                      soundscapes.length === 0 && styles.disabled,
                    ]}>
                    <Ionicons color={PassageColors.background} name="play" size={17} />
                    <Text style={styles.playAllLabel}>Play All</Text>
                  </Pressable>
                </View>
            </View>
            <FlatList
              ListEmptyComponent={
                <EmptyState
                  icon="musical-notes-outline"
                  message="Soundscapes are still being added to this collection."
                  title="Nothing here yet"
                />
              }
            contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
            data={soundscapes}
            initialNumToRender={8}
            keyExtractor={(item) => item.id}
            maxToRenderPerBatch={8}
            removeClippedSubviews
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            style={styles.soundscapeList}
            windowSize={7}
          />
          </View>
        )}
      </SafeAreaView>

      <Toast bottom={bottomInset + 20} notice={notice} />
    </ImageBackground>
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
  detailContent: {
    flex: 1,
    minHeight: 0,
  },
  soundscapeList: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 6,
  },
  iconButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
  hero: {
    backgroundColor: PassageColors.surface,
    borderColor: PassageColors.border,
    borderRadius: PassageRadius.card,
    borderWidth: 1,
    height: 210,
    justifyContent: 'flex-end',
    marginHorizontal: PassageSpacing.screenX,
    marginTop: 8,
    overflow: 'hidden',
  },
  heroSkeleton: {
    backgroundColor: PassageColors.skeleton,
    borderRadius: PassageRadius.card,
    height: 210,
    marginBottom: 20,
    marginHorizontal: PassageSpacing.screenX,
    marginTop: 8,
  },
  heroCopy: {
    padding: 18,
  },
  heroTitle: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 35,
  },
  heroMeta: {
    color: PassageColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  description: {
    color: PassageColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 16,
  },
  actions: {
    columnGap: 12,
    flexDirection: 'row',
    paddingHorizontal: PassageSpacing.screenX,
    paddingTop: 18,
    paddingBottom: 16,
  },
  playAll: {
    alignItems: 'center',
    backgroundColor: PassageColors.accent,
    borderRadius: PassageRadius.pill,
    columnGap: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  playAllPressed: {
    backgroundColor: PassageColors.accentPressed,
  },
  playAllLabel: {
    color: PassageColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
});
