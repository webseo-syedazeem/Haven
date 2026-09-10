import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/EmptyState';
import { PlaylistFormSheet } from '@/components/PlaylistFormSheet';
import { SoundscapeRow, SoundscapeRowSkeletonList } from '@/components/SoundscapeRow';
import { Toast, useToast } from '@/components/Toast';
import { HalcyonColors, HalcyonRadius, HalcyonSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useBottomSafeSpacing } from '@/hooks/use-bottom-safe-spacing';
import {
  useDeletePlaylist,
  usePlaylist,
  useRemoveFromPlaylist,
  useReorderPlaylist,
  useUpdatePlaylist,
} from '@/hooks/usePlaylists';
import type { Soundscape } from '@/lib/api/home';
import type { PlaylistItem, PlaylistPayload } from '@/lib/api/playlists';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bottomInset = useBottomSafeSpacing();
  const { notice, showToast } = useToast();
  const { playSoundscape } = usePlayerActions();

  const playlistQuery = usePlaylist(id);
  const playlist = playlistQuery.data;

  const { removeFromPlaylist } = useRemoveFromPlaylist();
  const { reorderPlaylist } = useReorderPlaylist();
  const { updatePlaylist, isUpdating } = useUpdatePlaylist();
  const { deletePlaylist } = useDeletePlaylist();

  const [menuVisible, setMenuVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  /** Local order so a move renders instantly; the API call follows. */
  const [order, setOrder] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    if (playlist?.items) setOrder(playlist.items);
  }, [playlist?.items]);

  const tracks = useMemo(
    () =>
      order
        .map((item) => item.soundscape)
        .filter((soundscape): soundscape is Soundscape => !!soundscape),
    [order]
  );

  const move = useCallback(
    (index: number, direction: -1 | 1) => {
      const target = index + direction;
      if (target < 0 || target >= order.length || !id) return;

      const next = [...order];
      [next[index], next[target]] = [next[target], next[index]];
      setOrder(next);

      // The server demands the complete, exact set of ids in the new order.
      void reorderPlaylist(
        id,
        next.map((item) => item.soundscape_id)
      ).catch(() => {
        setOrder(order);
        showToast('Could not save the new order.');
      });
    },
    [id, order, reorderPlaylist, showToast]
  );

  const handleRemove = useCallback(
    (soundscapeId: string) => {
      if (!id) return;
      void removeFromPlaylist(id, soundscapeId)
        .then(() => showToast('Removed from playlist.'))
        .catch(() => showToast('Could not remove that.'));
    },
    [id, removeFromPlaylist, showToast]
  );

  const handleEdit = useCallback(
    async (payload: PlaylistPayload) => {
      if (!id) return;
      try {
        await updatePlaylist(id, payload);
        setEditVisible(false);
        showToast('Playlist updated.');
      } catch {
        showToast('Could not save the playlist.');
      }
    },
    [id, showToast, updatePlaylist]
  );

  const confirmDelete = useCallback(() => {
    setMenuVisible(false);
    Alert.alert('Delete playlist?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!id) return;
          void deletePlaylist(id)
            .then(() => router.back())
            .catch(() => showToast('Could not delete the playlist.'));
        },
      },
    ]);
  }, [deletePlaylist, id, router, showToast]);

  const playAll = useCallback(async () => {
    const first = tracks.find((track) => !!track.file_url);
    if (!first) {
      showToast('Nothing in this playlist can be played yet.');
      return;
    }
    await playSoundscape(first, { queue: tracks });
    router.push('/player');
  }, [playSoundscape, router, showToast, tracks]);

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.textPrimary} name="chevron-back" size={22} />
          </Pressable>

          {!!playlist && (
            <Pressable
              accessibilityLabel="Playlist options"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => setMenuVisible(true)}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              <Ionicons
                color={HalcyonColors.textPrimary}
                name="ellipsis-horizontal"
                size={21}
              />
            </Pressable>
          )}
        </View>

        {playlistQuery.isInitialLoading ? (
          <SoundscapeRowSkeletonList />
        ) : playlistQuery.isError && !playlist ? (
          <ErrorState onRetry={() => void playlistQuery.refetch()} />
        ) : !playlist ? (
          <EmptyState
            actionLabel="Go back"
            icon="albums-outline"
            message="This playlist may have been deleted."
            onAction={() => router.back()}
            title="Playlist not found"
          />
        ) : (
          <FlatList
            ListEmptyComponent={
              <EmptyState
                icon="musical-notes-outline"
                message="Add soundscapes from the player or a soundscape's details."
                title="This playlist is empty"
              />
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <Text style={styles.title}>{playlist.name}</Text>
                <Text style={styles.meta}>
                  {order.length} {order.length === 1 ? 'sound' : 'sounds'}
                </Text>
                {!!playlist.description && (
                  <Text style={styles.description}>{playlist.description}</Text>
                )}

                <Pressable
                  accessibilityLabel="Play all"
                  accessibilityRole="button"
                  disabled={tracks.length === 0}
                  onPress={playAll}
                  style={({ pressed }) => [
                    styles.playAll,
                    pressed && styles.playAllPressed,
                    tracks.length === 0 && styles.disabled,
                  ]}>
                  <Ionicons color={HalcyonColors.background} name="play" size={17} />
                  <Text style={styles.playAllLabel}>Play All</Text>
                </Pressable>
              </View>
            }
            contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
            data={order}
            keyExtractor={(item) => item.soundscape_id}
            renderItem={({ item, index }) =>
              item.soundscape ? (
                <SoundscapeRow
                  leading={
                    /*
                      Arrows rather than drag-and-drop: reordering is a whole
                      list PUT, and a tap per step keeps that predictable
                      without pulling in a gesture list.
                    */
                    <View style={styles.reorder}>
                      <Pressable
                        accessibilityLabel="Move up"
                        accessibilityRole="button"
                        disabled={index === 0}
                        hitSlop={6}
                        onPress={() => move(index, -1)}>
                        <Ionicons
                          color={index === 0 ? HalcyonColors.skeleton : HalcyonColors.textSecondary}
                          name="chevron-up"
                          size={16}
                        />
                      </Pressable>
                      <Pressable
                        accessibilityLabel="Move down"
                        accessibilityRole="button"
                        disabled={index === order.length - 1}
                        hitSlop={6}
                        onPress={() => move(index, 1)}>
                        <Ionicons
                          color={
                            index === order.length - 1
                              ? HalcyonColors.skeleton
                              : HalcyonColors.textSecondary
                          }
                          name="chevron-down"
                          size={16}
                        />
                      </Pressable>
                    </View>
                  }
                  onPlay={(picked) => void playSoundscape(picked, { queue: tracks })}
                  onPress={(picked) => router.push(`/soundscape/${picked.id}` as Href)}
                  soundscape={item.soundscape}
                  trailing={
                    <Pressable
                      accessibilityLabel={`Remove ${item.soundscape.title}`}
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => handleRemove(item.soundscape_id)}
                      style={styles.removeButton}>
                      <Ionicons
                        color={HalcyonColors.textSecondary}
                        name="remove-circle-outline"
                        size={19}
                      />
                    </Pressable>
                  }
                />
              ) : null
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>

      <Modal
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
        transparent
        visible={menuVisible}>
        <Pressable
          accessibilityLabel="Close menu"
          onPress={() => setMenuVisible(false)}
          style={styles.menuBackdrop}
        />
        <View style={[styles.menu, { paddingBottom: bottomInset + 12 }]}>
          <Pressable
            accessibilityLabel="Edit playlist"
            accessibilityRole="button"
            onPress={() => {
              setMenuVisible(false);
              setEditVisible(true);
            }}
            style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.textPrimary} name="create-outline" size={19} />
            <Text style={styles.menuLabel}>Edit playlist</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Delete playlist"
            accessibilityRole="button"
            onPress={confirmDelete}
            style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
            <Ionicons color={HalcyonColors.accent} name="trash-outline" size={19} />
            <Text style={[styles.menuLabel, styles.menuLabelDanger]}>Delete playlist</Text>
          </Pressable>
        </View>
      </Modal>

      <PlaylistFormSheet
        busy={isUpdating}
        onClose={() => setEditVisible(false)}
        onSubmit={handleEdit}
        playlist={playlist}
        visible={editVisible}
      />

      <Toast bottom={bottomInset + 20} notice={notice} />
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 6,
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    paddingBottom: 18,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 10,
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 30,
    fontWeight: '600',
    lineHeight: 38,
  },
  meta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  description: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  playAll: {
    alignItems: 'center',
    backgroundColor: HalcyonColors.accent,
    borderRadius: HalcyonRadius.pill,
    columnGap: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
  reorder: {
    alignItems: 'center',
    rowGap: 2,
    width: 20,
  },
  removeButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 34,
  },
  menuBackdrop: {
    backgroundColor: 'rgba(4,4,6,0.6)',
    flex: 1,
  },
  menu: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 12,
  },
  menuRow: {
    alignItems: 'center',
    columnGap: 14,
    flexDirection: 'row',
    minHeight: 54,
  },
  menuLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 15,
    lineHeight: 21,
  },
  menuLabelDanger: {
    color: HalcyonColors.accent,
  },
});
