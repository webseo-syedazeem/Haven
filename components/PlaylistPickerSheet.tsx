import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaylistFormSheet } from '@/components/PlaylistFormSheet';
import { useAccountRequiredPrompt } from '@/components/auth/AccountRequiredPrompt';
import { HalcyonColors, HalcyonSpacing } from '@/constants/design';
import { AppFonts } from '@/constants/theme';
import { useAddToPlaylist, useCreatePlaylist, usePlaylists } from '@/hooks/usePlaylists';
import { useHasSession } from '@/hooks/useSession';
import type { Soundscape } from '@/lib/api/home';
import type { PlaylistPayload } from '@/lib/api/playlists';

type PlaylistPickerSheetProps = {
  visible: boolean;
  soundscape: Soundscape | null;
  onClose: () => void;
  onDone?: (message: string) => void;
};

/**
 * "Add to playlist" — the sheet that replaced the coming-soon toast. Lists the
 * user's playlists, ticks the ones the track has just been added to, and can
 * create a new playlist and add to it in one step.
 */
export function PlaylistPickerSheet({
  visible,
  soundscape,
  onClose,
  onDone,
}: PlaylistPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const hasSession = useHasSession();
  const { showAccountRequiredPrompt } = useAccountRequiredPrompt();
  const playlists = usePlaylists();
  const { addToPlaylist } = useAddToPlaylist();
  const { createPlaylist, isCreating } = useCreatePlaylist();

  const [formVisible, setFormVisible] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || hasSession) return;
    onClose();
    showAccountRequiredPrompt({
      title: 'Please log in',
      message: 'Log in to create playlists and save soundscapes to them.',
    });
  }, [hasSession, onClose, showAccountRequiredPrompt, visible]);

  const handleAdd = async (playlistId: string, playlistName: string) => {
    if (!soundscape) return;

    setPendingId(playlistId);
    setError(null);

    try {
      await addToPlaylist(playlistId, soundscape.id);
      setAddedIds((current) => [...current, playlistId]);
      onDone?.(`Added to ${playlistName}.`);
    } catch (caught) {
      // The API rejects a duplicate with a 400, which is worth saying plainly.
      const message = caught instanceof Error ? caught.message : '';
      setError(/already/i.test(message) ? 'Already in that playlist.' : 'Could not add to playlist.');
    } finally {
      setPendingId(null);
    }
  };

  const handleCreate = async (payload: PlaylistPayload) => {
    setError(null);

    try {
      const created = await createPlaylist(payload);
      setFormVisible(false);
      if (created?.id) {
        await handleAdd(created.id, created.name);
      }
    } catch {
      setError('Could not create the playlist.');
    }
  };

  const rows = playlists.data ?? [];

  if (!hasSession) return null;

  return (
    <>
      <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
        <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.backdrop} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Add to playlist</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}>
              <Ionicons color={HalcyonColors.textPrimary} name="close" size={22} />
            </Pressable>
          </View>

          {!!soundscape && (
            <Text numberOfLines={1} style={styles.subject}>
              {soundscape.short_title?.trim() || soundscape.title}
            </Text>
          )}

          <Pressable
            accessibilityLabel="New playlist"
            accessibilityRole="button"
            onPress={() => setFormVisible(true)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <View style={styles.newIcon}>
              <Ionicons color={HalcyonColors.accent} name="add" size={20} />
            </View>
            <Text style={[styles.rowLabel, styles.newLabel]}>New playlist</Text>
          </Pressable>

          <ScrollView style={styles.list}>
            {playlists.isInitialLoading ? (
              <View style={styles.stateBlock}>
                <ActivityIndicator color={HalcyonColors.accent} />
              </View>
            ) : playlists.isError ? (
              <Text style={styles.stateText}>Couldn&apos;t load your playlists.</Text>
            ) : rows.length === 0 ? (
              <Text style={styles.stateText}>
                No playlists yet — create one to save this soundscape.
              </Text>
            ) : (
              rows.map((playlist) => {
                const added = addedIds.includes(playlist.id);
                const busy = pendingId === playlist.id;
                const count = playlist.item_count ?? 0;

                return (
                  <Pressable
                    accessibilityLabel={`Add to ${playlist.name}`}
                    accessibilityRole="button"
                    disabled={busy || added}
                    key={playlist.id}
                    onPress={() => void handleAdd(playlist.id, playlist.name)}
                    style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                    <View style={styles.rowCopy}>
                      <Text numberOfLines={1} style={styles.rowLabel}>
                        {playlist.name}
                      </Text>
                      <Text style={styles.rowMeta}>
                        {count} {count === 1 ? 'sound' : 'sounds'}
                      </Text>
                    </View>

                    {busy ? (
                      <ActivityIndicator color={HalcyonColors.accent} size="small" />
                    ) : added ? (
                      <Ionicons color={HalcyonColors.accent} name="checkmark-circle" size={21} />
                    ) : (
                      <Ionicons
                        color={HalcyonColors.textSecondary}
                        name="ellipse-outline"
                        size={21}
                      />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
      </Modal>

      <PlaylistFormSheet
        busy={isCreating}
        onClose={() => setFormVisible(false)}
        onSubmit={handleCreate}
        visible={formVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(4,4,6,0.62)',
    flex: 1,
  },
  sheet: {
    backgroundColor: HalcyonColors.surface,
    borderTopColor: HalcyonColors.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '72%',
    paddingHorizontal: HalcyonSpacing.screenX,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.displaySemiBold,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
  },
  subject: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  list: {
    marginTop: 4,
  },
  row: {
    alignItems: 'center',
    borderTopColor: HalcyonColors.border,
    borderTopWidth: 1,
    columnGap: 12,
    flexDirection: 'row',
    minHeight: 58,
  },
  rowPressed: {
    opacity: 0.72,
  },
  rowCopy: {
    flex: 1,
  },
  rowLabel: {
    color: HalcyonColors.textPrimary,
    fontFamily: AppFonts.sansMedium,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  rowMeta: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  newIcon: {
    alignItems: 'center',
    borderColor: HalcyonColors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  newLabel: {
    color: HalcyonColors.accent,
  },
  stateBlock: {
    paddingVertical: 28,
  },
  stateText: {
    color: HalcyonColors.textSecondary,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    paddingVertical: 22,
  },
  error: {
    color: HalcyonColors.accent,
    fontFamily: AppFonts.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    paddingTop: 8,
  },
});
