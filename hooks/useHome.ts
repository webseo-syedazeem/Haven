import { useQuery } from '@tanstack/react-query';

import {
  FAVOURITES_QUERY_KEY,
  useFavourites,
  useFavouriteSoundscapes,
  useIsFavourite,
  useToggleFavourite,
} from '@/hooks/useFavourites';
import { useHasSession } from '@/hooks/useSession';
import { usePlayHistoryQuery, PLAY_HISTORY_QUERY_KEY } from '@/hooks/usePlayHistory';
import { homeApi, type Collection, type Soundscape } from '@/lib/api/home';
import type { PlayHistoryRow } from '@/lib/api/player';

/**
 * Favourites live in `useFavourites` so every screen shares one cache and one
 * optimistic toggle. Re-exported here because Home already imports them from
 * this module.
 */
export { useFavourites, useFavouriteSoundscapes, useIsFavourite, useToggleFavourite };

export const HOME_QUERY_KEYS = {
  continueListening: ['home', 'continue-listening'] as const,
  recommended: ['home', 'recommended'] as const,
  playHistory: PLAY_HISTORY_QUERY_KEY,
  favourites: FAVOURITES_QUERY_KEY,
  newToPassage: ['home', 'library', 'recently_added'] as const,
  shortSessions: ['home', 'library', 'shortest'] as const,
  popularCollections: ['home', 'collections', 'popular'] as const,
  soundscape: (id: string) => ['soundscape', id] as const,
};

const SHORT_SESSION_MAX_SECONDS = 600;
const RAIL_LIMIT = 10;

/** Signed in only — the endpoint 401s without a bearer token. */
export function useContinueListening() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: HOME_QUERY_KEYS.continueListening,
    queryFn: homeApi.continueListening,
    enabled: hasSession,
    select: (items) => (hasSession ? items.find((item) => item.soundscape) ?? null : null),
  });
}

/**
 * Personalised to the signed-in profile's history and preferences — a guest
 * has none of that yet, so this waits for a real account rather than showing
 * a generic "recommended" rail that isn't actually recommended for anyone.
 */
export function useRecommended() {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: HOME_QUERY_KEYS.recommended,
    queryFn: homeApi.recommended,
    enabled: hasSession,
    select: (items) => (hasSession ? items : []),
  });
}

/** Same cache entry as the Saved tab's Recently Played; this view is deduped. */
export function useRecentlyPlayed() {
  return usePlayHistoryQuery(dedupeSoundscapes);
}

function dedupeSoundscapes(rows: PlayHistoryRow[]): Soundscape[] {
  const seen = new Set<string>();
  const result: Soundscape[] = [];

  for (const { soundscape } of rows) {
    if (!soundscape?.id || seen.has(soundscape.id)) continue;
    seen.add(soundscape.id);
    result.push(soundscape);
  }

  return result;
}

export function useNewToPassage() {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: HOME_QUERY_KEYS.newToPassage,
    queryFn: () => homeApi.library({ sort: 'recently_added', limit: RAIL_LIMIT }),
    enabled: hasSession,
  });
}

export function useShortSessions() {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: HOME_QUERY_KEYS.shortSessions,
    queryFn: () =>
      homeApi.library({
        sort: 'shortest',
        max_duration: SHORT_SESSION_MAX_SECONDS,
        limit: RAIL_LIMIT,
      }),
    enabled: hasSession,
  });
}

export function usePopularCollections() {
  const hasSession = useHasSession();
  return useQuery<Collection[]>({
    queryKey: HOME_QUERY_KEYS.popularCollections,
    queryFn: homeApi.popularCollections,
    enabled: hasSession,
  });
}

export function useSoundscape(id?: string) {
  const hasSession = useHasSession();
  return useQuery({
    queryKey: HOME_QUERY_KEYS.soundscape(id ?? ''),
    queryFn: () => homeApi.soundscape(id!),
    enabled: hasSession && !!id,
  });
}
