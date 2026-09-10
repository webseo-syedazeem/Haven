import { useSyncExternalStore } from 'react';

import {
  hasActiveSession,
  isSessionRestoring,
  subscribeToSession,
} from '@/lib/auth/session-state';

/**
 * `true` once the launch time session restore has finished and an access token
 * is available. Authenticated queries stay disabled until then.
 */
export function useHasSession() {
  return useSyncExternalStore(subscribeToSession, hasActiveSession, hasActiveSession);
}

/**
 * `true` while the stored tokens are still being read and checked. A screen
 * that gates on a session waits on this instead of treating "not yet known" as
 * "signed out", which would show a sign-in prompt to somebody who is signed in.
 */
export function useSessionRestoring() {
  return useSyncExternalStore(subscribeToSession, isSessionRestoring, isSessionRestoring);
}
