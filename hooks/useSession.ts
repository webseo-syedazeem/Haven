import { useSyncExternalStore } from 'react';

import { hasActiveSession, subscribeToSession } from '@/lib/auth/session-state';

/**
 * `true` once the launch time session restore has finished and an access token
 * is available. Authenticated queries stay disabled until then.
 */
export function useHasSession() {
  return useSyncExternalStore(subscribeToSession, hasActiveSession, hasActiveSession);
}
