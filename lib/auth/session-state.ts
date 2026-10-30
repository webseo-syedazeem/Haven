import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  GUEST_MODE_ACTIVE_DEFAULT,
  getLocalSetting,
  LOCAL_SETTING_KEYS,
  setLocalSetting,
} from '@/lib/local-settings';

export const GUEST_MODE_STORAGE_KEY = 'is_guest';

/**
 * Tracks whether a signed-in session actually exists, so authenticated queries
 * (e.g. `/api/me`) never fire before the user has signed in.
 *
 * Two independent sources can hold a session: the Passage API tokens kept in
 * SecureStore, and the Supabase session used by Google/Apple sign in. Either one
 * being present means the app may talk to authenticated endpoints.
 */
type SessionSource = 'passage' | 'supabase';

const activeSources: Record<SessionSource, boolean> = {
  passage: false,
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
let guestPersistence: Promise<void> = Promise.resolve();

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

// True from the moment an explicit sign-out/account-deletion starts clearing
// the session until the login screen it navigates to has actually mounted.
//
  // `clearUserSession` drops the Passage access token as one of its first steps,
// which flips `hasActiveSession()` to false well before the explicit
// `resetToLogin()` navigation that follows it actually runs — the function
// awaits several more network/native calls (Google and Supabase sign-out
// among them) that can each take the better part of a second. Without this
// flag, the tabs layout's own "no session" guard reacts to that early flip on
// its own and navigates to `/login?launch=1` immediately, and then the
// explicit `resetToLogin()` call lands moments later on `/login?signedOut=1`
// — the login screen visibly mounting twice.
//
// Cleared for real once the login screen mounts; the timer here only guards
// against that mount never happening (an unexpected error before the
// explicit navigation runs), so a stuck flag can never permanently disable
// the automatic redirect for a later, unrelated session expiry.
let explicitSignOutInFlight = false;
let explicitSignOutSafetyTimer: ReturnType<typeof setTimeout> | null = null;

export function beginExplicitSignOut() {
  explicitSignOutInFlight = true;
  if (explicitSignOutSafetyTimer) clearTimeout(explicitSignOutSafetyTimer);
  explicitSignOutSafetyTimer = setTimeout(() => {
    explicitSignOutInFlight = false;
    explicitSignOutSafetyTimer = null;
  }, 10000);
}

/** Called once the login screen (the explicit sign-out's destination) mounts. */
export function endExplicitSignOut() {
  explicitSignOutInFlight = false;
  if (explicitSignOutSafetyTimer) {
    clearTimeout(explicitSignOutSafetyTimer);
    explicitSignOutSafetyTimer = null;
  }
}

export function isExplicitSignOutInFlight() {
  return explicitSignOutInFlight;
}

/** True when an authenticated request is safe to make. */
export function hasActiveSession() {
  return !restoring && !guestModeActive && (activeSources.passage || activeSources.supabase);
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
export function setGuestModeActive(active: boolean): Promise<void> {
  const changed = guestModeActive !== active;

  if (guestModeActive === active) {
    return persistGuestMode(active);
  }

  guestModeActive = active;
  persistGuestMode(active);

  // Guest state has consumers of its own (for example the account-required
  // popup), so listeners must hear this even when hasActiveSession() was false
  // both before and after the change.
  if (changed) notify();
  return guestPersistence;
}

/** Loads the persisted flag into memory. Call once, before the launch restore settles. */
export async function hydrateGuestMode(): Promise<void> {
  let stored: string | null = null;

  try {
    stored = await AsyncStorage.getItem(GUEST_MODE_STORAGE_KEY);
  } catch {
    // The legacy store below still gives existing installs a safe fallback.
  }

  if (stored !== null) {
    guestModeActive = stored === 'true';
    return;
  }

  // One-time migration from the earlier SecureStore/localStorage setting.
  guestModeActive = await getLocalSetting(
    LOCAL_SETTING_KEYS.guestModeActive,
    GUEST_MODE_ACTIVE_DEFAULT
  );
  if (guestModeActive) persistGuestMode(true);
}

function persistGuestMode(active: boolean): Promise<void> {
  guestPersistence = guestPersistence
    .catch(() => undefined)
    .then(async () => {
      if (active) {
        await AsyncStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
      } else {
        // Keep an authoritative false tombstone. Removing the key would make
        // the legacy-store migration run again and could resurrect an old
        // guest=true value after a partial storage failure.
        await AsyncStorage.setItem(GUEST_MODE_STORAGE_KEY, 'false');
      }

      // Keep the old key in a non-guest state after migration so it can never
      // reactivate guest mode if AsyncStorage is later cleared independently.
      await setLocalSetting(LOCAL_SETTING_KEYS.guestModeActive, active);
    })
    .catch(() => undefined);
  return guestPersistence;
}
