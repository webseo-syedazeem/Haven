/** Central, synchronous authentication state used by navigation and queries. */
type SessionSource = 'passage' | 'supabase';

const activeSources: Record<SessionSource, boolean> = {
  passage: false,
  supabase: false,
};

let restoring = true;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

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

export function hasActiveSession() {
  return !restoring && (activeSources.passage || activeSources.supabase);
}

export function isSessionRestoring() {
  return restoring;
}

export function setSessionSource(source: SessionSource, active: boolean) {
  if (activeSources[source] === active) return;
  const wasActive = hasActiveSession();
  activeSources[source] = active;
  if (hasActiveSession() !== wasActive) notify();
}

export function finishSessionRestore() {
  if (!restoring) return;
  restoring = false;
  notify();
}

export function subscribeToSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
