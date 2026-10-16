import {
  getGuestOnboardingAnswers,
  restoreGuestOnboardingAnswers,
  type GuestOnboardingAnswers,
} from '@/lib/onboarding';
import { getLocalSetting, setLocalSetting } from '@/lib/local-settings';
import { queryClient } from '@/lib/query-client';

/**
 * Backs the TestFlight-only "Replay onboarding" button. Lets a tester re-run
 * onboarding as many times as they like without signing out or losing their
 * session/guest state.
 *
 * `replayActive` is an in-memory module variable only — it is gone the moment
 * the app process restarts. The pre-replay answers snapshot is written to the
 * same on-device store `lib/onboarding.ts` already uses, specifically so an
 * abandoned replay can still be undone after an app kill, when the in-memory
 * flag is no longer available to detect anything.
 */
const REPLAY_SNAPSHOT_KEY = 'onboarding.dev_replay_snapshot.v1';

let replayActive = false;

export function isOnboardingReplayActive(): boolean {
  return replayActive;
}

/** Snapshots the current local onboarding answers and marks a replay active. */
export async function beginOnboardingReplay(): Promise<void> {
  const snapshot = await getGuestOnboardingAnswers();
  await setLocalSetting<GuestOnboardingAnswers | null>(REPLAY_SNAPSHOT_KEY, snapshot);
  replayActive = true;
}

/**
 * Called once a replay's final submit has actually succeeded. The new answers
 * are already correct on disk (and, for a signed-in user, on the server) via
 * the normal completion path, so this only clears the replay bookkeeping and
 * busts the recommendation caches the normal completion path does not touch.
 */
export async function endOnboardingReplay(): Promise<void> {
  replayActive = false;
  await setLocalSetting<GuestOnboardingAnswers | null>(REPLAY_SNAPSHOT_KEY, null);
  await queryClient.invalidateQueries({ queryKey: ['onboarding'] }).catch(() => undefined);
}

/**
 * Restores whatever local onboarding answers existed before the most recently
 * started replay, if that replay was never finished — whether it was
 * abandoned earlier in this same run (the in-memory flag is still true) or
 * left behind by an app kill (the flag reset to false on relaunch, but the
 * on-disk snapshot survives). Safe to call unconditionally on every launch;
 * a no-op once no snapshot remains on disk.
 */
export async function recoverAbandonedOnboardingReplay(): Promise<void> {
  replayActive = false;
  const snapshot = await getLocalSetting<GuestOnboardingAnswers | null>(
    REPLAY_SNAPSHOT_KEY,
    null
  );
  if (!snapshot) return;

  await restoreGuestOnboardingAnswers(snapshot);
  await setLocalSetting<GuestOnboardingAnswers | null>(REPLAY_SNAPSHOT_KEY, null);
}
