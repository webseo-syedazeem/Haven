import {
  GUEST_MODE_ACTIVE_DEFAULT,
  getLocalSetting,
  LOCAL_SETTING_KEYS,
  setLocalSetting,
} from '@/lib/local-settings';

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

/**
 * True from an explicit "Continue as guest" tap until the next confirmed sign
 * in (see `markLoggedIn` in lib/auth/offline-session.ts, the single funnel
 * every sign in/up/refresh/restore success goes through). A hard override
 * rather than something inferred from `activeSources`: those two flags have
 * gone stale-true before (a dead token nothing ever cleared), which kept
 * firing `/api/me`, `/api/favourites`, `/api/home/continue-listening` and
 * `/api/play-history` with no usable token and a 401 every time. This flag
 * does not depend on that bookkeeping being right.
 */
let guestModeActive = false;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/** True when an authenticated request is safe to make. */
export function hasActiveSession() {
  return !restoring && !guestModeActive && (activeSources.haven || activeSources.supabase);
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

/** Synchronous — `enabled` props need an instant answer, not an awaited read. */
export function isGuestModeActive() {
  return guestModeActive;
}

/**
 * Sets the in-memory flag immediately (so `hasActiveSession()` reflects it on
 * the very next read) and persists it in the background. Call with `true`
 * from "Continue as guest"; `markLoggedIn` calls it with `false` on every
 * confirmed sign in so a later real account is never left gated by a guest
 * choice made earlier on the same device.
 */
export function setGuestModeActive(active: boolean) {
  if (guestModeActive === active) {
    void setLocalSetting(LOCAL_SETTING_KEYS.guestModeActive, active);
    return;
  }

  const wasActive = hasActiveSession();
  guestModeActive = active;
  void setLocalSetting(LOCAL_SETTING_KEYS.guestModeActive, active);

  if (hasActiveSession() !== wasActive) {
    notify();
  }
}

/** Loads the persisted flag into memory. Call once, before the launch restore settles. */
export async function hydrateGuestMode(): Promise<void> {
  guestModeActive = await getLocalSetting(
    LOCAL_SETTING_KEYS.guestModeActive,
    GUEST_MODE_ACTIVE_DEFAULT
  );
}
