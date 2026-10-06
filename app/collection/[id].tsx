import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SoundscapeRow, SoundscapeRowSkeletonList } from '@/components/SoundscapeRow';
import { Toast, useToast } from '@/components/Toast';
import {
  HalcyonCardGradient,
  HalcyonCardGradientLocations,
  HalcyonColors,
  HalcyonRadius,
  HalcyonSpacing,
} from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';
import {
  getDownloadBlockNotice,
  useDownloadCollection,
  type BulkDownloadPlan,
} from '@/hooks/useDownloads';
import { useCollection } from '@/hooks/useExplore';
import { useFavouriteIds, useToggleFavourite } from '@/hooks/useFavourites';
import type { Soundscape } from '@/lib/api/home';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

function formatDownloadSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

export default function CollectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bottomInset = useBottomSafeSpacing();
  const { notice, showToast } = useToast();
  const { playSoundscape } = usePlayerActions();

  const collectionQuery = useCollection(id);
  const collection = collectionQuery.data;
  // Memoised so the play/download callbacks are not rebuilt on every render.
  const soundscapes = useMemo(() => collection?.soundscapes ?? [], [collection]);

  const favouriteIds = useFavouriteIds();
  const { toggleFavourite } = useToggleFavourite();
  const { prepareDownload, downloadAll, cancel, progress, isDownloading } =
    useDownloadCollection();
  const [downloadPlan, setDownloadPlan] = useState<BulkDownloadPlan | null>(null);

  const playAll = useCallback(async () => {
    const first = soundscapes.find((soundscape) => !!soundscape.file_url);
    if (!first) {
      showToast('Nothing in this collection can be played yet.');
      return;
    }
    await playSoundscape(first, { queue: soundscapes });
    router.push('/player');
  }, [playSoundscape, router, showToast, soundscapes]);

  const requestCollectionDownload = useCallback(async () => {
    try {
      const plan = await prepareDownload(soundscapes);
      if (plan.total === 0) {
        showToast(
          plan.skipped > 0
            ? 'Every downloadable track is already saved.'
            : 'Nothing here can be downloaded yet.'
        );
        return;
      }
      setDownloadPlan(plan);
    } catch (error) {
      const notice = getDownloadBlockNotice(error);
      if (notice) {
        Alert.alert(notice.title, notice.message);
      } else {
        showToast('Could not prepare this download. Try again.');
      }
    }
  }, [prepareDownload, showToast, soundscapes]);

  const confirmCollectionDownload = useCallback(async () => {
    const plan = downloadPlan;
    if (!plan) return;
    setDownloadPlan(null);

    const outcome = await downloadAll(plan);
    if (outcome.failed > 0 || outcome.cancelled > 0) {
      const details = [
        `${outcome.completed} saved`,
        outcome.failed > 0 ? `${outcome.failed} failed` : null,
        outcome.cancelled > 0 ? `${outcome.cancelled} cancelled` : null,
        outcome.skipped > 0 ? `${outcome.skipped} already on this device` : null,
      ]
        .filter(Boolean)
        .join(', ');
      Alert.alert('Collection download finished', `${details}.`);
      return;
    }

    showToast(
      outcome.skipped > 0
        ? `Saved ${outcome.completed}; ${outcome.skipped} already on this device.`
        : `Saved ${outcome.completed} for offline listening.`
    );
  }, [downloadAll, downloadPlan, showToast]);

  const confirmationMessage = useMemo(() => {
    if (!downloadPlan) return '';
    const size = downloadPlan.totalBytes
      ? ` (${formatDownloadSize(downloadPlan.totalBytes)})`
      : '';
    const notes = [
      downloadPlan.skipped > 0
        ? `${downloadPlan.skipped} already-downloaded track${downloadPlan.skipped === 1 ? '' : 's'} will be skipped.`
        : null,
      downloadPlan.unavailable > 0
        ? `${downloadPlan.unavailable} unavailable track${downloadPlan.unavailable === 1 ? '' : 's'} cannot be downloaded.`
        : null,
    ]
      .filter(Boolean)
      .join(' ');

    return `Download ${downloadPlan.total} track${downloadPlan.total === 1 ? '' : 's'}${size} to this device for offline listening?${notes ? ` ${notes}` : ''}`;
  }, [downloadPlan]);

  const renderRow = useCallback(
    ({ item }: { item: Soundscape }) => (
      <SoundscapeRow
        isFavourite={favouriteIds.has(item.id)}
        onPlay={(picked) => void playSoundscape(picked, { queue: soundscapes })}
        onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
        onToggleFavourite={toggleFavourite}
        showFavourite
        soundscape={item}
        variant="saved"
      />
    ),
    [favouriteIds, playSoundscape, router, soundscapes, toggleFavourite]
  );

  return (
    <ImageBackground
      source={require('@/assets/images/explore-collection-detail-bg.webp')}
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
                    locations={
                      HalcyonCardGradientLocations as unknown as readonly [number, number, ...number[]]
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
                    <Ionicons color={HalcyonColors.background} name="play" size={17} />
                    <Text style={styles.playAllLabel}>Play All</Text>
                  </Pressable>

                  <Pressable
                    accessibilityLabel={isDownloading ? 'Cancel collection download' : 'Download collection'}
                    accessibilityRole="button"
                    disabled={soundscapes.length === 0}
                    onPress={isDownloading ? cancel : () => void requestCollectionDownload()}
                    style={({ pressed }) => [
                      styles.downloadAll,
                      pressed && styles.pressed,
                      soundscapes.length === 0 && styles.disabled,
                    ]}>
                    <Ionicons
                      color={HalcyonColors.textPrimary}
                      name={isDownloading ? 'close-circle-outline' : 'download-outline'}
                      size={17}
                    />
                    <Text style={styles.downloadAllLabel}>
                      {progress?.cancelRequested ? 'Cancelling' : isDownloading ? 'Cancel' : 'Download'}
                    </Text>
                  </Pressable>
                </View>

                {!!progress && (
                  <View style={styles.progressBlock}>
                    <Text style={styles.progressLabel}>
                      {progress.cancelRequested
                        ? 'Finishing the current download'
                        : `Downloading ${progress.current} of ${progress.total}`}
                      {progress.failed > 0 ? ` · ${progress.failed} failed` : ''}
                    </Text>
                    <View style={styles.progressTrack}>
                      <View style={{ flex: progress.processed / Math.max(1, progress.total) }}>
                        <View style={styles.progressFill} />
                      </View>
                      <View
                        style={{
                          flex: 1 - progress.processed / Math.max(1, progress.total),
                        }}
                      />
                    </View>
                  </View>
                )}
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
            keyExtractor={(item) => item.id}
            renderItem={renderRow}
            showsVerticalScrollIndicator={false}
            style={styles.soundscapeList}
          />
          </View>
        )}
      </SafeAreaView>

      <ConfirmDialog
        confirmLabel={downloadPlan ? `Download ${downloadPlan.total}` : 'Download'}
        icon="download-outline"
        message={confirmationMessage}
        onCancel={() => setDownloadPlan(null)}
        onConfirm={() => void confirmCollectionDownload()}
        title="Download collection?"
        visible={downloadPlan !== null}
      />
      <Toast bottom={bottomInset + 20} notice={notice} />
    </ImageBackground>
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
  detailContent: {
    flex: 1,
    minHeight: 0,
  },
  soundscapeList: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: HalcyonSpacing.screenX,
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
    backgroundColor: HalcyonColors.surface,
    borderColor: HalcyonColors.border,
    borderRadius: HalcyonRadius.card,
    borderWidth: 1,
    height: 210,
    justifyContent: 'flex-end',
    marginHorizontal: HalcyonSpacing.screenX,
    marginTop: 8,
    overflow: 'hidden',
  },
  heroSkeleton: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: HalcyonRadius.card,
    height: 210,
    marginBottom: 20,
    marginHorizontal: HalcyonSpacing.screenX,
    marginTop: 8,
  },
  heroCopy: {
    padding: 18,
  },
  heroTitle: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 35,
  },
  heroMeta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  description: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 16,
  },
  actions: {
    columnGap: 12,
    flexDirection: 'row',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 18,
    paddingBottom: 16,
  },
  playAll: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    columnGap: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  playAllPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  playAllLabel: {
    color: HalcyonColors.background,
    fontFamily: AppFonts.sansSemiBold,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  downloadAll: {
    alignItems: 'center',
    borderColor: HalcyonColors.textPrimary,
    borderRadius: HalcyonRadius.pill,
    borderWidth: 1,
    columnGap: 8,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  downloadAllLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  progressBlock: {
    marginTop: 12,
  },
  progressLabel: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 17,
    marginHorizontal: HalcyonSpacing.screenX,
  },
  progressTrack: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 2,
    flexDirection: 'row',
    height: 4,
    marginHorizontal: HalcyonSpacing.screenX,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: HalcyonColors.accent,
    flex: 1,
    height: 4,
  },
});
