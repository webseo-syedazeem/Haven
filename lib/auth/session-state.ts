/**
 * Tracks whether a signed-in session actually exists, so authenticated queries
 * (e.g. `/api/me`) never fire before the user has signed in.
 *
 * Two independent sources can hold a session: the Haven API tokens kept in
 * SecureStore, and the Supabase session used by Google/Apple sign in. Either one
 * being present means the app may talk to authenticated endpoints.
 */
type SessionSource = 'haven' | 'supabase';

const activeSources: Record<SessionSource, boolean> = {
  haven: false,
  supabase: false,
};

// Stays true until the stored tokens have been read and validated on launch, so
// authenticated queries wait for the restore instead of racing it.
let restoring = true;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** True when an authenticated request is safe to make. */
export function hasActiveSession() {
  return !restoring && (activeSources.haven || activeSources.supabase);
}

/**
 * True until the launch time restore has settled. Distinct from "signed out":
 * nothing is known yet either way, which is what a sign-in gate needs in order
 * to wait rather than tell a signed-in user to log in.
 */
export function isSessionRestoring() {
  return restoring;
}

export function setSessionSource(source: SessionSource, active: boolean) {
  if (activeSources[source] === active) {
    return;
  }

  const wasActive = hasActiveSession();
  activeSources[source] = active;

  if (hasActiveSession() !== wasActive) {
    notify();
  }
}

/** Called once the launch time session restore has settled, either way. */
export function finishSessionRestore() {
  if (!restoring) {
    return;
  }

  restoring = false;
  // Always, not only when `hasActiveSession()` flips: a restore that ends in no
  // session leaves that value unchanged, and a subscriber watching
  // `isSessionRestoring` still has to hear that the waiting is over. Listeners
  // that read an unchanged value re-render to the same output and cost nothing.
  notify();
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
