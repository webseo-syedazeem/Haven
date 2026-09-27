import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useHasSession } from '@/hooks/useSession';
import {
  playlistsApi,
  type Playlist,
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
    onSuccess: () => {
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

export function useAddToPlaylist() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ playlistId, soundscapeId }: { playlistId: string; soundscapeId: string }) =>
      playlistsApi.addItem(playlistId, soundscapeId),
    onSuccess: (_data, { playlistId }) => {
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: PLAYLIST_QUERY_KEYS.detail(playlistId) });
    },
  });

  const { mutateAsync } = mutation;
  const addToPlaylist = useCallback(
    (playlistId: string, soundscapeId: string) => mutateAsync({ playlistId, soundscapeId }),
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
