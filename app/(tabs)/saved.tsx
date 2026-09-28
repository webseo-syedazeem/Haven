import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { RequireAuth, useRequireAuth } from '@/components/RequireAuth';
import { SoundscapeRow, SoundscapeRowSkeletonList } from '@/components/SoundscapeRow';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonRadius, HalcyonSpacing, Typography } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useTabContentInset } from '@/hooks/use-bottom-safe-spacing';
import {
  getDownloadBlockNotice,
  useDownloads,
  useDownloadSoundscape,
  useDownloadsStorage,
  useRemoveAllDownloads,
  useRemoveDownload,
} from '@/hooks/useDownloads';
import { useFavouriteSoundscapes, useToggleFavourite } from '@/hooks/useFavourites';
import { usePlayHistory, usePlaySoundscapeById } from '@/hooks/usePlayHistory';
import { useCreatePlaylist, usePlaylists } from '@/hooks/usePlaylists';
import type { Soundscape } from '@/lib/api/home';
import type { PlaylistPayload } from '@/lib/api/playlists';
import {
  remoteSourceFromLocalDownload,
  soundscapeFromLocalDownload,
  type LocalDownload,
  type LocalDownloadStatus,
} from '@/lib/local-downloads';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

type SavedSegment = 'favourites' | 'playlists' | 'downloads' | 'recent';

const SEGMENTS: readonly { value: SavedSegment; label: string }[] = [
  { value: 'favourites', label: 'Favourites' },
  { value: 'playlists', label: 'Playlists' },
  { value: 'downloads', label: 'Downloads' },
  { value: 'recent', label: 'Recently Played' },
];

export default function SavedScreen() {
  // An offline launch with downloads on disk lands here on `?segment=downloads`,
  // so the user opens straight onto the only content that works without a
  // connection. Any other value falls back to the usual first tab.
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
            Three of the four live on the account, so without a session they are
            not rendered at all and the prompt takes their place — the panels'
            queries never mount, so nothing is asked of the server first.
            Downloads is the exception: it reads the on-device manifest, which
            is meaningful with or without a session, and shows an empty list
            rather than a prompt when nobody is signed in. */}
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
        {segment === 'downloads' && (
          <DownloadsPanel bottomInset={bottomInset} onNotice={showToast} />
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
        message="Tap the heart on any soundscape to save it here."
        title="No favourites yet"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: bottomInset }}
      data={soundscapes}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SoundscapeRow
          isFavourite
          onPlay={(picked) => void playSoundscape(picked, { queue: soundscapes })}
          onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
          onToggleFavourite={(picked) => {
            toggleFavourite(picked, true);
            onNotice('Removed from favourites.');
          }}
          showFavourite
          soundscape={item}
        />
      )}
      showsVerticalScrollIndicator={false}
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

/* ------------------------------------------------------------------ S-06 */

/**
 * S-06. Everything here comes from the on-device manifest, so the list, the
 * sizes and the play buttons are all correct with no connection — which is the
 * one thing a downloads screen has to get right.
 */
function DownloadsPanel({
  bottomInset,
  onNotice,
}: {
  bottomInset: number;
  onNotice: (message: string) => void;
}) {
  const { hasSession } = useRequireAuth();
  const downloads = useDownloads();
  const storage = useDownloadsStorage();
  const { removeDownload } = useRemoveDownload();
  const { removeAllDownloads, isRemoving } = useRemoveAllDownloads();
  const { download } = useDownloadSoundscape();
  const playById = usePlaySoundscapeById();

  const rows = downloads.data;
  const totalBytes = storage.data.total_bytes;

  const retry = useCallback(
    (entry: LocalDownload) => {
      void download(remoteSourceFromLocalDownload(entry))
        .then(() => onNotice('Saved for offline listening.'))
        .catch((error) => {
          const notice = getDownloadBlockNotice(error);
          if (notice) {
            Alert.alert(notice.title, notice.message);
          } else {
            onNotice('Download failed. Try again.');
          }
        });
    },
    [download, onNotice]
  );

  const confirmRemoveAll = useCallback(() => {
    Alert.alert('Remove all downloads?', 'Every soundscape you have saved will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove all',
        style: 'destructive',
        onPress: () => {
          void removeAllDownloads()
            .then(() => onNotice('Downloads removed.'))
            .catch(() => onNotice('Could not remove downloads.'));
        },
      },
    ]);
  }, [onNotice, removeAllDownloads]);

  // No error branch: the manifest is a local file, so there is nothing here
  // that a lost connection can fail.
  if (downloads.isInitialLoading) return <SoundscapeRowSkeletonList />;

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="cloud-download-outline"
        message={
          hasSession
            ? 'Download a soundscape to listen offline.'
            : 'Downloads are saved to your account. Log in to see yours, or to save something new.'
        }
        title={hasSession ? 'No downloads yet' : 'Nothing downloaded here'}
      />
    );
  }

  return (
    <FlatList
      ListHeaderComponent={
        <View style={styles.storageBlock}>
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>
              {formatBytes(totalBytes)} used · {rows.length}{' '}
              {rows.length === 1 ? 'download' : 'downloads'}
            </Text>
            <Pressable
              accessibilityLabel="Remove all downloads"
              accessibilityRole="button"
              disabled={isRemoving}
              hitSlop={8}
              onPress={confirmRemoveAll}>
              <Text style={styles.storageAction}>Remove all</Text>
            </Pressable>
          </View>
          {/* Relative bar: the API reports usage but no device quota. */}
          <View style={styles.storageTrack}>
            <View style={[styles.storageFill, { flex: Math.min(1, totalBytes / GB) }]} />
            <View style={{ flex: Math.max(0, 1 - Math.min(1, totalBytes / GB)) }} />
          </View>
        </View>
      }
      contentContainerStyle={{ paddingBottom: bottomInset }}
      data={rows}
      keyExtractor={(item) => item.soundscape_id}
      renderItem={({ item }) => (
        <DownloadRow
          download={item}
          onPlay={() => void playById(item.soundscape_id)}
          onRemove={() => {
            void removeDownload(item.soundscape_id)
              .then(() => onNotice('Download removed.'))
              .catch(() => onNotice('Could not remove that download.'));
          }}
          onRetry={() => retry(item)}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const GB = 1024 * 1024 * 1024;

function DownloadRow({
  download,
  onPlay,
  onRemove,
  onRetry,
}: {
  download: LocalDownload;
  onPlay: () => void;
  onRemove: () => void;
  onRetry: () => void;
}) {
  // The manifest carries the title, cover, mode and duration, so the row draws
  // in full without the catalogue endpoint.
  const soundscape = soundscapeFromLocalDownload(download);

  return (
    <SoundscapeRow
      // Only a verified file is playable; anything else would open nothing.
      onPlay={download.status === 'completed' ? onPlay : undefined}
      soundscape={soundscape}
      subtitle={downloadSubtitle(download)}
      trailing={
        <View style={styles.downloadTrailing}>
          {download.status === 'failed' ? (
            <Pressable
              accessibilityLabel={`Retry ${soundscape.title}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={onRetry}>
              <Ionicons color={HalcyonColors.accent} name="refresh-outline" size={18} />
            </Pressable>
          ) : (
            <DownloadStatusIcon status={download.status} />
          )}
          <Pressable
            accessibilityLabel={`Remove ${soundscape.title}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={onRemove}>
            <Ionicons color={HalcyonColors.textSecondary} name="trash-outline" size={18} />
          </Pressable>
        </View>
      }
    />
  );
}

/**
 * `SoundscapeRow` appends the duration itself, so this line carries only what
 * the duration does not say: the size once saved, the real progress before.
 */
function downloadSubtitle(download: LocalDownload): string {
  switch (download.status) {
    case 'completed':
      return download.file_size_bytes ? formatBytes(download.file_size_bytes) : '';
    case 'downloading':
      return `Downloading · ${download.progress_percent}%`;
    case 'queued':
      return 'Queued';
    default:
      return 'Download failed — tap to retry';
  }
}

function DownloadStatusIcon({ status }: { status: LocalDownloadStatus }) {
  if (status === 'completed') {
    return <Ionicons color={HalcyonColors.accent} name="checkmark-circle" size={19} />;
  }
  // queued and downloading: the percentage is on the subtitle line, so this
  // stays a simple activity mark rather than a second progress readout.
  return <ActivityIndicator color={HalcyonColors.textSecondary} size="small" />;
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

  const queue = useMemo(() => entries.map((entry) => entry.soundscape), [entries]);

  if (history.isInitialLoading) return <SoundscapeRowSkeletonList />;
  if (history.isError && entries.length === 0) {
    return <ErrorState onRetry={() => void history.refetch()} />;
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon="time-outline"
        message="The soundscapes you play will show up here."
        title="Nothing played yet"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: bottomInset }}
      data={entries}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <SoundscapeRow
          onPlay={(picked) => void playSoundscape(picked, { queue })}
          onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
          soundscape={item.soundscape}
          subtitle={formatPlayedAt(item.played_at)}
          trailing={
            <Pressable
              accessibilityLabel={`Resume ${item.soundscape.title}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void playSoundscape(item.soundscape, { queue })}
              style={styles.resumeButton}>
              <Ionicons color={HalcyonColors.accent} name="play" size={16} />
            </Pressable>
          }
        />
      )}
      showsVerticalScrollIndicator={false}
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

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
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
  storageBlock: {
    paddingBottom: 14,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 18,
  },
  storageRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  storageLabel: {
    ...Typography.muted,
  },
  storageAction: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansMedium,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  storageTrack: {
    backgroundColor: HalcyonColors.skeleton,
    borderRadius: 3,
    flexDirection: 'row',
    height: 5,
    overflow: 'hidden',
  },
  storageFill: {
    backgroundColor: HalcyonColors.accent,
  },
  downloadTrailing: {
    alignItems: 'center',
    columnGap: 14,
    flexDirection: 'row',
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
