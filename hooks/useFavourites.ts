import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

import { useHasSession } from '@/hooks/useSession';
import { homeApi, type Favourite, type Soundscape } from '@/lib/api/home';

/**
 * The single source of truth for favourites. Cards, rows, the soundscape
 * detail screen, the player and the Saved tab all read and write through here,
 * so one heart flipping anywhere flips everywhere.
 *
 * The key is unchanged from when this lived in `useHome`, so existing cached
 * data survives.
 */
export const FAVOURITES_QUERY_KEY = ['home', 'favourites'] as const;

export function useFavourites() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: FAVOURITES_QUERY_KEY,
    queryFn: homeApi.favourites,
    enabled: hasSession,
  });
}

/** Favourite soundscapes, flattened for rails and lists. */
export function useFavouriteSoundscapes() {
  const query = useFavourites();

  const soundscapes = useMemo<Soundscape[]>(
    () =>
      (query.data ?? [])
        .map((favourite) => favourite.soundscape)
        .filter((soundscape): soundscape is Soundscape => !!soundscape),
    [query.data]
  );

  return {
    soundscapes,
    isInitialLoading: query.isInitialLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useIsFavourite(soundscapeId?: string) {
  const { data } = useFavourites();

  return useMemo(
    () => !!soundscapeId && (data ?? []).some((item) => item.soundscape_id === soundscapeId),
    [data, soundscapeId]
  );
}

/**
 * A set of every favourited id, for lists that need to ask the question once
 * per row without re-scanning the array each time.
 */
export function useFavouriteIds(): Set<string> {
  const { data } = useFavourites();

  return useMemo(() => new Set((data ?? []).map((item) => item.soundscape_id)), [data]);
}

type ToggleFavouriteInput = { soundscape: Soundscape; isFavourite: boolean };

/**
 * Optimistic favourite toggle — the heart flips immediately and rolls back if
 * the request fails.
 */
export function useToggleFavourite() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ soundscape, isFavourite }: ToggleFavouriteInput) =>
      isFavourite ? homeApi.removeFavourite(soundscape.id) : homeApi.addFavourite(soundscape.id),
    onMutate: async ({ soundscape, isFavourite }: ToggleFavouriteInput) => {
      await queryClient.cancelQueries({ queryKey: FAVOURITES_QUERY_KEY });
      const previous = queryClient.getQueryData<Favourite[]>(FAVOURITES_QUERY_KEY);

      queryClient.setQueryData<Favourite[]>(FAVOURITES_QUERY_KEY, (current) => {
        const rows = current ?? [];
        if (isFavourite) {
          return rows.filter((row) => row.soundscape_id !== soundscape.id);
        }

        if (rows.some((row) => row.soundscape_id === soundscape.id)) return rows;

        return [
          {
            id: `optimistic-${soundscape.id}`,
            soundscape_id: soundscape.id,
            created_at: new Date().toISOString(),
            soundscape,
          },
          ...rows,
        ];
      });

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVOURITES_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVOURITES_QUERY_KEY });
    },
  });

  const { mutate } = mutation;
  const toggleFavourite = useCallback(
    (soundscape: Soundscape, isFavourite: boolean) => mutate({ soundscape, isFavourite }),
    [mutate]
  );

  return { ...mutation, toggleFavourite };
}
