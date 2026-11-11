import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useHasSession } from '@/hooks/useSession';
import { ApiError } from '@/lib/api/errors';
import type { Soundscape } from '@/lib/api/home';
import {
  playlistsApi,
  type Playlist,
  type PlaylistDetail,
  type PlaylistItem,
  type PlaylistPayload,
} from '@/lib/api/playlists';

export const PLAYLIST_QUERY_KEYS = {
  all: ['playlists'] as const,
  detail: (id: string) => ['playlists', id] as const,
};

export function usePlaylists() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PLAYLIST_QUERY_KEYS.all,
    queryFn: playlistsApi.list,
    enabled: hasSession,
  });
}

export function usePlaylist(id?: string) {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PLAYLIST_QUERY_KEYS.detail(id ?? ''),
    queryFn: () => playlistsApi.detail(id!),
    enabled: hasSession && !!id,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: PlaylistPayload) => playlistsApi.create(payload),
    // Optimistic: the new playlist appears at the top of the list immediately,
    // then reconciles with the server's real row on settle.
    onMutate: async (payload: PlaylistPayload) => {
      await queryClient.cancelQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
      const previous = queryClient.getQueryData<Playlist[]>(PLAYLIST_QUERY_KEYS.all);

      const optimistic: Playlist = {
        id: `optimistic-${Date.now()}`,
        name: payload.name,
        description: payload.description ?? null,
        cover_image_url: payload.cover_image_url ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        item_count: 0,
      };

      queryClient.setQueryData<Playlist[]>(PLAYLIST_QUERY_KEYS.all, (current) => [
        optimistic,
        ...(current ?? []),
      ]);

      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PLAYLIST_QUERY_KEYS.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
    },
  });

  const { mutateAsync } = mutation;
  const createPlaylist = useCallback(
    (payload: PlaylistPayload) => mutateAsync(payload),
    [mutateAsync]
  );

  return { createPlaylist, isCreating: mutation.isLoading, isError: mutation.isError };
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<PlaylistPayload> }) =>
      playlistsApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.detail(id) });
    },
  });

  const { mutateAsync } = mutation;
  const updatePlaylist = useCallback(
    (id: string, payload: Partial<PlaylistPayload>) => mutateAsync({ id, payload }),
    [mutateAsync]
  );

  return { updatePlaylist, isUpdating: mutation.isLoading, isError: mutation.isError };
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => playlistsApi.remove(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
      const previous = queryClient.getQueryData<Playlist[]>(PLAYLIST_QUERY_KEYS.all);

      queryClient.setQueryData<Playlist[]>(PLAYLIST_QUERY_KEYS.all, (current) =>
        (current ?? []).filter((playlist) => playlist.id !== id)
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(PLAYLIST_QUERY_KEYS.all, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
    },
  });

  const { mutateAsync } = mutation;
  const deletePlaylist = useCallback((id: string) => mutateAsync(id), [mutateAsync]);

  return { deletePlaylist, isDeleting: mutation.isLoading };
}

type AddToPlaylistInput = {
  playlistId: string;
  soundscapeId: string;
  /** Passed so the item can show instantly in an open playlist detail. */
  soundscape?: Soundscape | null;
};

export function useAddToPlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // "Already in playlist" is the desired end state, not a failure — treat it as
    // a soft success so there is no error overlay; the optimistic add just stays.
    mutationFn: async ({ playlistId, soundscapeId }: AddToPlaylistInput) => {
      try {
        await playlistsApi.addItem(playlistId, soundscapeId);
        return { alreadyExisted: false };
      } catch (error) {
        if (error instanceof ApiError && /already/i.test(error.message)) {
          return { alreadyExisted: true };
        }
        throw error;
      }
    },
    // Optimistic: the playlist's count bumps immediately, and if its detail is
    // open the soundscape appears at once.
    onMutate: async ({ playlistId, soundscapeId, soundscape }: AddToPlaylistInput) => {
      const detailKey = PLAYLIST_QUERY_KEYS.detail(playlistId);
      await queryClient.cancelQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
      await queryClient.cancelQueries({ queryKey: detailKey });

      const previousList = queryClient.getQueryData<Playlist[]>(PLAYLIST_QUERY_KEYS.all);
      const previousDetail = queryClient.getQueryData<PlaylistDetail | null>(detailKey);

      // Bump the "X sounds" count in the list.
      queryClient.setQueryData<Playlist[]>(PLAYLIST_QUERY_KEYS.all, (current) =>
        (current ?? []).map((playlist) =>
          playlist.id === playlistId
            ? { ...playlist, item_count: (playlist.item_count ?? 0) + 1 }
            : playlist
        )
      );

      // Add the soundscape to the open detail, if any (and not already there).
      queryClient.setQueryData<PlaylistDetail | null>(detailKey, (current) => {
        if (!current) return current;
        if (current.items.some((item) => item.soundscape_id === soundscapeId)) return current;

        const newItem: PlaylistItem = {
          playlist_id: playlistId,
          soundscape_id: soundscapeId,
          sort_order: current.items.length,
          added_at: new Date().toISOString(),
          soundscape: soundscape ?? null,
        };
        return { ...current, items: [...current.items, newItem] };
      });

      return { previousList, previousDetail, detailKey };
    },
    onError: (_error, _input, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(PLAYLIST_QUERY_KEYS.all, context.previousList);
      }
      if (context && context.previousDetail !== undefined) {
        queryClient.setQueryData(context.detailKey, context.previousDetail);
      }
    },
    onSettled: (_data, _error, { playlistId }) => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.detail(playlistId) });
    },
  });

  const { mutateAsync } = mutation;
  const addToPlaylist = useCallback(
    (playlistId: string, soundscapeId: string, soundscape?: Soundscape | null) =>
      mutateAsync({ playlistId, soundscapeId, soundscape }),
    [mutateAsync]
  );

  return { addToPlaylist, isAdding: mutation.isLoading };
}

export function useRemoveFromPlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ playlistId, soundscapeId }: { playlistId: string; soundscapeId: string }) =>
      playlistsApi.removeItem(playlistId, soundscapeId),
    onMutate: async ({ playlistId, soundscapeId }) => {
      const key = PLAYLIST_QUERY_KEYS.detail(playlistId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<{ items: PlaylistItem[] } | null>(key);

      queryClient.setQueryData(key, (current: { items: PlaylistItem[] } | null | undefined) =>
        current
          ? {
              ...current,
              items: current.items.filter((item) => item.soundscape_id !== soundscapeId),
            }
          : current
      );

      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context?.previous && context.key) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _error, { playlistId }) => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.detail(playlistId) });
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
    },
  });

  const { mutateAsync } = mutation;
  const removeFromPlaylist = useCallback(
    (playlistId: string, soundscapeId: string) => mutateAsync({ playlistId, soundscapeId }),
    [mutateAsync]
  );

  return { removeFromPlaylist, isRemoving: mutation.isLoading };
}

/**
 * The server rejects anything that is not an exact permutation of the current
 * items, so the caller sends the whole reordered list of ids.
 */
export function useReorderPlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ playlistId, soundscapeIds }: { playlistId: string; soundscapeIds: string[] }) =>
      playlistsApi.reorder(playlistId, soundscapeIds),
    onSettled: (_data, _error, { playlistId }) => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.detail(playlistId) });
    },
  });

  const { mutateAsync } = mutation;
  const reorderPlaylist = useCallback(
    (playlistId: string, soundscapeIds: string[]) => mutateAsync({ playlistId, soundscapeIds }),
    [mutateAsync]
  );

  return { reorderPlaylist, isReordering: mutation.isLoading };
}
