import { QueryClient } from '@tanstack/react-query';

import { isNetworkError } from '@/lib/api/errors';

/** Long enough that a restored cache is still there to show; see `query-persist`. */
const CACHE_TIME_MS = 1000 * 60 * 60 * 24;
const STALE_TIME_MS = 1000 * 60 * 5;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,
      // A query has to survive in memory long enough to be written to disk and
      // restored on the next launch; the v4 default of 5 minutes drops it first.
      cacheTime: CACHE_TIME_MS,
      // Fire even when the client believes it is offline, then keep whatever
      // came back last time. This is what makes a screen show its cached
      // contents instead of an empty state.
      networkMode: 'offlineFirst',
      // Retrying a request that never reached anyone just delays the moment the
      // cached data is shown. Anything the server actually answered gets one
      // more go.
      retry: (failureCount, error) => !isNetworkError(error) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});
