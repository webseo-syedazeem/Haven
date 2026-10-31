import * as Network from 'expo-network';

import { PLAYBACK_HEALTH_CONFIG as CFG } from '@/constants/playback-health';

/**
 * Adaptive playback health monitoring.
 *
 * Replaces a single fixed "buffering for N seconds = slow connection" timer,
 * which cannot tell a slow-but-healthy CDN cold start (common on a fast
 * connection) from a genuinely bad one. Instead this watches for a *pattern*
 * of evidence collected only after the current track's startup has already
 * completed — repeated or sustained stalls — never a single timeout.
 *
 * Framework-agnostic, same style as `createPlayerEngine`: `PlayerProvider`
 * feeds it events from the engine listeners it already subscribes to; this
 * module owns no player state and never drives retries — the engine's own
 * watchdog (`engine.ts`) already does that. It only decides which message,
 * if any, is accurate to show.
 */

export type PlaybackHealthVerdict = 'none' | 'interruptions';

export type PlaybackHealthMonitor = {
  /** New track/session: clears all history and re-arms the startup phase. */
  reset: () => void;
  /**
   * Call once playback of the current track is genuinely confirmed moving
   * (the same evidence `PlayerProvider` already uses for `confirmsPlayback`).
   * Ends the startup phase — buffering/recovery before this point never
   * counts toward "repeated stalls".
   */
  confirmPlaybackStarted: () => void;
  /** A buffering episode (isBuffering true→false) just ended, after startup. */
  reportBufferingEpisode: (durationMs: number) => void;
  /** The engine's own watchdog started or stopped actively recovering. */
  reportRecoveryEpisode: (isRecovering: boolean) => void;
  /** The current verdict, freshly computed over the rolling window. */
  getVerdict: () => PlaybackHealthVerdict;
  /** Whether the device is actually disconnected right now — not a speed guess. */
  isOffline: () => boolean;
  /**
   * Fires when the verdict may have changed for a reason other than one of
   * the `report*` calls above (the sustained-recovery timer elapsing).
   * Call `getVerdict()` again in response.
   */
  subscribe: (listener: () => void) => () => void;
  destroy: () => void;
};

export function createPlaybackHealthMonitor(): PlaybackHealthMonitor {
  let startupPending = true;
  let bufferingLog: { at: number; durationMs: number }[] = [];
  let recoveryLog: { at: number }[] = [];
  let recoveringSince: number | null = null;
  let sustainedTimer: ReturnType<typeof setTimeout> | null = null;
  let isConnected = true;
  let networkSubscription: { remove: () => void } | null = null;
  const listeners = new Set<() => void>();

  function notify() {
    for (const listener of listeners) listener();
  }

  function clearSustainedTimer() {
    if (sustainedTimer) clearTimeout(sustainedTimer);
    sustainedTimer = null;
  }

  function armSustainedTimer() {
    clearSustainedTimer();
    sustainedTimer = setTimeout(() => {
      sustainedTimer = null;
      notify();
    }, CFG.SUSTAINED_RECOVERY_MS);
  }

  function prune(now: number) {
    const cutoff = now - CFG.ROLLING_WINDOW_MS;
    bufferingLog = bufferingLog.filter((entry) => entry.at >= cutoff);
    recoveryLog = recoveryLog.filter((entry) => entry.at >= cutoff);
  }

  function applyNetworkState(state: Network.NetworkState) {
    isConnected = !(state.isConnected === false || state.isInternetReachable === false);
  }

  networkSubscription = Network.addNetworkStateListener(applyNetworkState);
  void Network.getNetworkStateAsync().then(applyNetworkState).catch(() => {
    // Unknown stays "connected" — never guess offline without evidence.
  });

  return {
    reset() {
      startupPending = true;
      bufferingLog = [];
      recoveryLog = [];
      recoveringSince = null;
      clearSustainedTimer();
    },

    confirmPlaybackStarted() {
      startupPending = false;
    },

    reportBufferingEpisode(durationMs) {
      if (startupPending || durationMs <= 0) return;
      prune(Date.now());
      bufferingLog.push({ at: Date.now(), durationMs });
    },

    reportRecoveryEpisode(isRecovering) {
      if (startupPending) {
        // A startup bad enough to need the engine's own evidence-based
        // watchdog is still startup latency, not a steady-state pattern —
        // never arm the sustained timer or count it against the window.
        if (!isRecovering) recoveringSince = null;
        return;
      }

      if (isRecovering) {
        if (recoveringSince === null) {
          recoveringSince = Date.now();
          armSustainedTimer();
        }
        prune(Date.now());
        recoveryLog.push({ at: Date.now() });
      } else {
        recoveringSince = null;
        clearSustainedTimer();
      }
    },

    getVerdict(): PlaybackHealthVerdict {
      const now = Date.now();
      prune(now);

      const totalBufferingMs = bufferingLog.reduce((sum, entry) => sum + entry.durationMs, 0);
      const repeatedBuffering =
        bufferingLog.length >= CFG.BUFFERING_EPISODE_THRESHOLD &&
        totalBufferingMs >= CFG.BUFFERING_TOTAL_MS_THRESHOLD;
      const repeatedRecovery = recoveryLog.length >= CFG.RECOVERY_EPISODE_THRESHOLD;
      const sustainedRecovery =
        recoveringSince !== null && now - recoveringSince >= CFG.SUSTAINED_RECOVERY_MS;

      return repeatedBuffering || repeatedRecovery || sustainedRecovery ? 'interruptions' : 'none';
    },

    isOffline() {
      return !isConnected;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      clearSustainedTimer();
      networkSubscription?.remove();
      networkSubscription = null;
      listeners.clear();
    },
  };
}
