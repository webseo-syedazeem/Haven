import { useQuery } from '@tanstack/react-query';

import { useHasSession } from '@/hooks/useSession';
import {
  playerApi,
  PLAY_HISTORY_QUERY_KEY,
  type PlayHistoryRow,
} from '@/lib/api/player';

export { PLAY_HISTORY_QUERY_KEY };

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
