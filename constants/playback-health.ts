/**
 * Thresholds for the adaptive playback health monitor (`lib/player/playbackHealth.ts`).
 *
 * These exist because a single fixed "buffering for N seconds = slow
 * connection" timer produces false positives: CDN cold starts, origin
 * latency and audio-session setup can all legitimately make the *first*
 * buffer take a while on a fast connection. Instead, a real problem is
 * judged from a pattern of evidence collected after startup — repeated or
 * sustained stalls — not a single timeout.
 *
 * Values are intentionally conservative: it is better to take longer to
 * report a genuine problem than to flag a healthy connection as slow.
 */
export const PLAYBACK_HEALTH_CONFIG = {
  /** How far back "repeated" looks. Older buffering/recovery episodes age out. */
  ROLLING_WINDOW_MS: 120_000,

  /** Raw buffering episodes (isBuffering true→false) inside the window. */
  BUFFERING_EPISODE_THRESHOLD: 3,
  /**
   * Cumulative buffering time inside the window. Both this and the episode
   * count must be met — frequency alone can be a handful of harmless blips,
   * duration alone can be one already-explained buffer — together they are
   * real evidence of a pattern.
   */
  BUFFERING_TOTAL_MS_THRESHOLD: 15_000,

  /**
   * Engine-confirmed stalls (`onRecoveryStateChange(true)`) inside the
   * window. Each one already required the engine's own 4–10s evidence-based
   * watchdog thresholds to fire, so this is much higher-signal than raw
   * buffering and needs fewer repeats to count as a pattern.
   */
  RECOVERY_EPISODE_THRESHOLD: 2,

  /**
   * A single recovery episode active this long, on its own, is worth
   * escalating even as the first episode. Kept above the engine's own
   * `RECOVERY_RESET_MS` (20s) so this never races the engine's internal
   * attempt-reset — by the time this fires, the engine has already been
   * retrying well past its own "healthy again" window.
   */
  SUSTAINED_RECOVERY_MS: 25_000,
} as const;
