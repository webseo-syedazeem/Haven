import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useHasSession } from '@/hooks/useSession';
import { homeApi, type Soundscape } from '@/lib/api/home';
import { playerApi, type PlayHistoryRow } from '@/lib/api/player';
import { getLocalDownload, soundscapeFromLocalDownload } from '@/lib/local-downloads';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

/** One cache entry for every play-history consumer (Home rail, Saved tab). */
export const PLAY_HISTORY_QUERY_KEY = ['home', 'play-history'] as const;

/**
 * The raw history rows, newest first, with `played_at` intact. Home's rail
 * reads the same cache entry through `useRecentlyPlayed`, which dedupes.
 */
export function usePlayHistory() {
  return usePlayHistoryQuery((rows) => rows);
}

/** Shared by every consumer so the key, fetcher and session gate cannot drift. */
export function usePlayHistoryQuery<T>(project: (rows: PlayHistoryRow[]) => T) {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PLAY_HISTORY_QUERY_KEY,
    queryFn: playerApi.getPlayHistory,
    enabled: hasSession,
    select: (rows) => project(hasSession ? rows : []),
  });
}

/**
 * Plays a soundscape when only its id is to hand.
 *
 * Downloads come first: a completed manifest entry already carries everything
 * the player needs, so a saved soundscape starts with no request at all — which
 * is the whole point, since `GET /api/soundscapes/:id` is not available on a
 * plane. Anything else is fetched through the query cache, so a repeat tap is
 * free, and a cached row is preferred over a fetch that would fail offline.
 */
export function usePlaySoundscapeById() {
  const queryClient = useQueryClient();
  const { playSoundscape } = usePlayerActions();

  return useCallback(
    async (soundscapeId: string, options?: { queue?: Soundscape[]; startAt?: number }) => {
      const local = getLocalDownload(soundscapeId);
      if (local?.status === 'completed') {
        await playSoundscape(soundscapeFromLocalDownload(local), options);
        return;
      }

      const soundscape =
        queryClient.getQueryData<Soundscape>(['soundscape', soundscapeId]) ??
        (await queryClient.fetchQuery({
          queryKey: ['soundscape', soundscapeId],
          queryFn: () => homeApi.soundscape(soundscapeId),
        }));

      if (!soundscape) return;
      await playSoundscape(soundscape, options);
    },
    [playSoundscape, queryClient]
  );
}
