import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useHasSession } from '@/hooks/useSession';
import { homeApi, type Soundscape } from '@/lib/api/home';
import { playerApi } from '@/lib/api/player';
import { getLocalDownload, soundscapeFromLocalDownload } from '@/lib/local-downloads';
import { usePlayerActions } from '@/lib/player/PlayerProvider';

export const PLAY_HISTORY_QUERY_KEY = ['play-history', 'rows'] as const;

/**
 * The raw history rows, newest first, with `played_at` intact — the Home rail
 * uses the deduped soundscape list from `useHome` instead.
 */
export function usePlayHistory() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: PLAY_HISTORY_QUERY_KEY,
    queryFn: playerApi.getPlayHistory,
    enabled: hasSession,
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
