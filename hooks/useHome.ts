import { useQuery } from '@tanstack/react-query';

import {
  FAVOURITES_QUERY_KEY,
  useFavourites,
  useFavouriteSoundscapes,
  useIsFavourite,
  useToggleFavourite,
} from '@/hooks/useFavourites';
import { useHasSession } from '@/hooks/useSession';
import { homeApi, type Collection } from '@/lib/api/home';

/**
 * Favourites live in `useFavourites` so every screen shares one cache and one
 * optimistic toggle. Re-exported here because Home already imports them from
 * this module.
 */
export { useFavourites, useFavouriteSoundscapes, useIsFavourite, useToggleFavourite };

export const HOME_QUERY_KEYS = {
  continueListening: ['home', 'continue-listening'] as const,
  recommended: ['home', 'recommended'] as const,
  playHistory: ['home', 'play-history'] as const,
  favourites: FAVOURITES_QUERY_KEY,
  newToHalcyon: ['home', 'library', 'recently_added'] as const,
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
    select: (items) => items.find((item) => item.soundscape) ?? null,
  });
}

export function useRecommended() {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.recommended,
    queryFn: homeApi.recommended,
  });
}

export function useRecentlyPlayed() {
  const hasSession = useHasSession();

  return useQuery({
    queryKey: HOME_QUERY_KEYS.playHistory,
    queryFn: homeApi.playHistory,
    enabled: hasSession,
  });
}

export function useNewToHalcyon() {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.newToHalcyon,
    queryFn: () => homeApi.library({ sort: 'recently_added', limit: RAIL_LIMIT }),
  });
}

export function useShortSessions() {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.shortSessions,
    queryFn: () =>
      homeApi.library({
        sort: 'shortest',
        max_duration: SHORT_SESSION_MAX_SECONDS,
        limit: RAIL_LIMIT,
      }),
  });
}

export function usePopularCollections() {
  return useQuery<Collection[]>({
    queryKey: HOME_QUERY_KEYS.popularCollections,
    queryFn: homeApi.popularCollections,
  });
}

export function useSoundscape(id?: string) {
  return useQuery({
    queryKey: HOME_QUERY_KEYS.soundscape(id ?? ''),
    queryFn: () => homeApi.soundscape(id!),
    enabled: !!id,
  });
}
