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

  const wasActive = hasActiveSession();
  restoring = false;

  if (hasActiveSession() !== wasActive) {
    notify();
  }
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
