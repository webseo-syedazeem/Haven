import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/EmptyState';
import { FilterChip } from '@/components/FilterChip';
import { PlaylistCard } from '@/components/PlaylistCard';
import { PlaylistFormSheet } from '@/components/PlaylistFormSheet';
import { RequireAuth } from '@/components/RequireAuth';
import { SoundscapeRow, SoundscapeRowSkeletonList } from '@/components/SoundscapeRow';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonRadius, HalcyonSpacing, Typography } from '@/constants/design';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import { useFavouriteSoundscapes, useToggleFavourite } from '@/hooks/useFavourites';
import { usePlayHistory } from '@/hooks/usePlayHistory';
import { useCreatePlaylist, usePlaylists } from '@/hooks/usePlaylists';
import type { Soundscape } from '@/lib/api/home';
import type { PlaylistPayload } from '@/lib/api/playlists';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

type SavedSegment = 'favourites' | 'playlists' | 'recent';

const SEGMENTS: readonly { value: SavedSegment; label: string }[] = [
  { value: 'favourites', label: 'Favourites' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'recent', label: 'Recently Played' },
];

export default function SavedScreen() {
  const { segment: requested } = useLocalSearchParams<{ segment?: string }>();
  const [segment, setSegment] = useState<SavedSegment>(() =>
    SEGMENTS.some((option) => option.value === requested)
      ? (requested as SavedSegment)
      : 'favourites'
  );
  const bottomInset = useTabContentInset();
  const { notice, showToast } = useToast();
  return (
    <View style={styles.screen}>
      {segment === 'favourites' && (
        <Image
          source={require('@/assets/images/saved-favourites-birch-v7.webp')}
          resizeMode="cover"
          style={styles.favouritesBackground}
        />
      )}
      {segment === 'recent' && (
        <Image
          source={require('@/assets/images/saved-recent-atlantic-cliff-v7.webp')}
          resizeMode={'cover'}
          style={styles.recentBackground}
        />
      )}
      {segment === 'playlists' && (
        <Image
          source={require('@/assets/images/saved-playlists-moon-desert-v8.webp')}
          resizeMode="cover"
          style={styles.playlistsBackground}
        />
      )}
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.heading}>Saved</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.chipRow}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.horizontalScroll}>
          {SEGMENTS.map((option) => (
            <FilterChip
              key={option.value}
              label={option.label}
              onPress={() => setSegment(option.value)}
              selected={segment === option.value}
            />
          ))}
        </ScrollView>

        {/* Each segment mounts only when selected, so it fetches on first view.
            All three live on the account, so without a session they are not
            rendered at all and the prompt takes their place — the panels'
            queries never mount, so nothing is asked of the server first. */}
        {segment === 'favourites' && (
          <RequireAuth
            message="Log in and the soundscapes you have hearted will be waiting here."
            showBack={false}
            title="Sign in to see your favourites"
            waiting={<SoundscapeRowSkeletonList />}>
            <FavouritesPanel bottomInset={bottomInset} onNotice={showToast} />
          </RequireAuth>
        )}
        {segment === 'playlists' && (
          <RequireAuth
            message="Playlists are saved to your account, so they follow you between devices."
            showBack={false}
            title="Sign in to see your playlists"
            waiting={<SoundscapeRowSkeletonList />}>
            <PlaylistsPanel bottomInset={bottomInset} onNotice={showToast} />
          </RequireAuth>
        )}
        {segment === 'recent' && (
          <RequireAuth
            message="Log in and Passage will keep track of what you have listened to."
            showBack={false}
            title="Sign in to see what you played"
            waiting={<SoundscapeRowSkeletonList />}>
            <RecentPanel bottomInset={bottomInset} />
          </RequireAuth>
        )}
      </SafeAreaView>

      <Toast bottom={bottomInset + 12} notice={notice} />
    </View>
  );
}

/* ------------------------------------------------------------------ S-02 */

function FavouritesPanel({
  bottomInset,
  onNotice,
}: {
  bottomInset: number;
  onNotice: (message: string) => void;
}) {
  const router = useRouter();
  const { playSoundscape } = usePlayerActions();
  const { soundscapes, isInitialLoading, isError, refetch } = useFavouriteSoundscapes();
  const { toggleFavourite } = useToggleFavourite();

  if (isInitialLoading) return <SoundscapeRowSkeletonList />;
  // Only when there is genuinely nothing to show: a failed refresh over a
  // restored cache still leaves a usable list.
  if (isError && soundscapes.length === 0) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (soundscapes.length === 0) {
    return (
      <EmptyState
        icon="heart-outline"
        iconColor={HalcyonColors.textPrimary}
        message="Tap the heart on any soundscape to save it here."
        title="No favourites yet"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: bottomInset }}
      data={soundscapes}
      initialNumToRender={8}
      keyExtractor={(item) => item.id}
      maxToRenderPerBatch={8}
      removeClippedSubviews
      renderItem={({ item }) => (
        <SoundscapeRow
          isFavourite
          onPlay={(picked) => void playSoundscape(picked)}
          onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
          onToggleFavourite={(picked) => {
            toggleFavourite(picked, true);
            onNotice('Removed from favourites.');
          }}
          showFavourite
          soundscape={item}
          variant={'saved'}
        />
      )}
      showsVerticalScrollIndicator={false}
      windowSize={7}
    />
  );
}

/* ------------------------------------------------------------------ S-03 */

function PlaylistsPanel({
  bottomInset,
  onNotice,
}: {
  bottomInset: number;
  onNotice: (message: string) => void;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const playlists = usePlaylists();
  const { createPlaylist, isCreating } = useCreatePlaylist();
  const [formVisible, setFormVisible] = useState(false);

  const cardWidth = (width - HalcyonSpacing.screenX * 2 - 14) / 2;

  const handleCreate = useCallback(
    async (payload: PlaylistPayload) => {
      try {
        await createPlaylist(payload);
        setFormVisible(false);
        onNotice('Playlist created.');
      } catch {
        onNotice('Could not create the playlist.');
      }
    },
    [createPlaylist, onNotice]
  );

  const rows = playlists.data ?? [];

  return (
    <View style={styles.panel}>
      {playlists.isInitialLoading ? (
        <View style={styles.gridSkeleton}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[styles.skeletonBlock, { height: cardWidth, width: cardWidth }]}
            />
          ))}
        </View>
      ) : playlists.isError && rows.length === 0 ? (
        <ErrorState onRetry={() => void playlists.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          actionLabel="New playlist"
          icon="albums-outline"
          iconColor={HalcyonColors.textPrimary}
          message="Create a playlist to group your favourite soundscapes."
          onAction={() => setFormVisible(true)}
          title="No playlists yet"
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.grid, { paddingBottom: bottomInset }]}
          showsVerticalScrollIndicator={false}>
          {rows.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              onPress={(picked) => router.push(`/playlist/${picked.id}` as Href)}
              playlist={playlist}
              width={cardWidth}
            />
          ))}
        </ScrollView>
      )}

      <Pressable
        accessibilityLabel="New playlist"
        accessibilityRole="button"
        onPress={() => setFormVisible(true)}
        style={({ pressed }) => [
          styles.fab,
          { bottom: bottomInset - 12 },
          pressed && styles.fabPressed,
        ]}>
        <Ionicons color={HalcyonColors.background} name="add" size={26} />
      </Pressable>

      <PlaylistFormSheet
        busy={isCreating}
        onClose={() => setFormVisible(false)}
        onSubmit={handleCreate}
        visible={formVisible}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ S-07 */

function RecentPanel({ bottomInset }: { bottomInset: number }) {
  const router = useRouter();
  const { playSoundscape } = usePlayerActions();
  const history = usePlayHistory();

  const entries = useMemo(
    () =>
      (history.data ?? []).filter(
        (row): row is typeof row & { soundscape: Soundscape } => !!row.soundscape
      ),
    [history.data]
  );

  if (history.isInitialLoading) return <SoundscapeRowSkeletonList />;
  if (history.isError && entries.length === 0) {
    return <ErrorState onRetry={() => void history.refetch()} />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="time-outline"
        iconColor={HalcyonColors.textPrimary}
        message="The soundscapes you play will show up here."
        title="Nothing played yet"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: bottomInset }}
      data={entries}
      initialNumToRender={8}
      keyExtractor={(item) => item.id}
      maxToRenderPerBatch={8}
      removeClippedSubviews
      renderItem={({ item }) => (
        <SoundscapeRow
          onPlay={(picked) => void playSoundscape(picked)}
          onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
          soundscape={item.soundscape}
          subtitle={formatPlayedAt(item.played_at)}
          variant={'saved'}
          trailing={
            <Pressable
              accessibilityLabel={`Resume ${item.soundscape.title}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void playSoundscape(item.soundscape)}
              style={styles.resumeButton}>
              <Ionicons color={HalcyonColors.accent} name="play" size={16} />
            </Pressable>
          }
        />
      )}
      showsVerticalScrollIndicator={false}
      windowSize={7}
    />
  );
}

function formatPlayedAt(value?: string): string {
  if (!value) return '';

  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';

  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;

  return new Date(value).toLocaleDateString();
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: HalcyonColors.background,
    flex: 1,
  },
  favouritesBackground: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  recentBackground: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 12,
  },
  heading: {
    ...Typography.screenHeading,
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
    marginBottom: 8,
    marginTop: 18,
  },
  panel: {
    flex: 1,
  },
  playlistsBackground: {
    ...StyleSheet.absoluteFillObject,
    height: undefined,
    width: undefined,
  },
  grid: {
    columnGap: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 18,
    rowGap: 20,
  },
  gridSkeleton: {
    columnGap: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 18,
    rowGap: 20,
  },
  skeletonBlock: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: HalcyonRadius.artwork,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: 28,
    elevation: 6,
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    right: HalcyonSpacing.screenX,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    width: 56,
  },
  fabPressed: {
    backgroundColor: HalcyonColors.accentPressed,
  },
  resumeButton: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
});
