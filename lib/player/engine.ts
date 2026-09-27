import {
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
  type AudioMetadata,
  type AudioPlayer,
  type AudioStatus,
} from 'expo-audio';

import {
  getArtworkCache,
  type EngineListeners,
  type EngineOptions,
  type PlayableTrack,
  type PlayerEngine,
} from './types';

/**
 * expo-audio wrapper. Everything the app does to audio goes through here, so no
 * screen imports the audio library directly — which also keeps `engine.web.ts`
 * able to stand in for it on web.
 *
 * One long lived `AudioPlayer` holds the active soundscape. The app queue stays
 * in `PlayerProvider`, so loading a track only ever replaces this one source.
 *
 * `engine` is the app-wide instance the provider owns. `createPlayerEngine`
 * builds an independent one (its own native player and listeners) for a screen
 * that needs a short lived, self-contained playback, like the onboarding preview.
 */

/** expo-audio's own default, and the cadence the slider was built against. */
const STATUS_INTERVAL_MS = 500;

/** The 10s skip buttons expo-audio drives natively from the media session. */
const LOCK_SCREEN_OPTIONS = { showSeekForward: true, showSeekBackward: true };

const END_TONE_VOLUME = 0.7;
/** Releases the end tone even if its finish event never lands. */
const END_TONE_FAILSAFE_MS = 30_000;

/**
 * The stall watchdog. expo-audio reports no playback errors: a failed load on
 * Android leaves ExoPlayer idle, fetching nothing until the source is prepared
 * again, and a failed item on iOS just stops. So while playback is wanted the
 * engine samples the native player and reloads the source once it stops moving.
 */
const WATCHDOG_INTERVAL_MS = 1000;
/** Idle with a source loaded only follows a failed load, so it is acted on almost at once. */
const IDLE_TIMEOUT_MS = 1500;
/** A player that says it is playing has to move; frozen this long is a stall. */
const STALL_TIMEOUT_MS = 4000;
/** Real buffering on a slow connection takes a while, so only this long counts as stuck. */
const BUFFERING_TIMEOUT_MS = 10_000;
/** Automatic reloads per failure before the listeners are told playback failed. */
const MAX_RECOVERY_ATTEMPTS = 2;
/** Unbroken playback this long closes a failure, restoring the full retry budget. */
const RECOVERY_RESET_MS = 20_000;
/** Movement smaller than this is rounding, not progress. */
const PROGRESS_EPSILON_SECONDS = 0.2;
/** How far from a seek target playback may resume and still count as landed. */
const SEEK_LANDING_TOLERANCE_SECONDS = 5;

type Subscription = { remove: () => void };

/** What the native player is doing, read from its own state rather than inferred. */
type NativePhase = 'playing' | 'buffering' | 'paused' | 'idle' | 'ended';

/** Durations and positions arrive as NaN or -1 until a source is ready. */
function safeSeconds(value: number | undefined | null): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * `playbackState` means something different on each platform in expo-audio:
 *
 * - Android: ExoPlayer's own state — 'idle', 'buffering', 'ready' or 'ended'.
 *   'idle' with a source loaded only follows a failed load: ExoPlayer fetches
 *   nothing more until the source is prepared again.
 * - iOS: AVPlayer's status — 'unknown', 'readyToPlay' or 'failed'. It describes
 *   the player, not the item, so the item-level `isLoaded` and `isBuffering`
 *   decide there.
 *
 * `isLoaded` is no use for this on Android: expo-audio overwrites it with
 * `!isLoading` whenever ExoPlayer starts or stops fetching a chunk, so it reads
 * false in the middle of healthy playback.
 */
function phaseOf(status: AudioStatus): NativePhase {
  if (status.playing) return 'playing';

  switch (status.playbackState) {
    case 'buffering':
      return 'buffering';
    case 'ready':
      return 'paused';
    case 'ended':
      return 'ended';
    case 'idle':
    case 'failed':
      return 'idle';
  }

  return status.isBuffering || !status.isLoaded ? 'buffering' : 'paused';
}

function toMetadata(track: PlayableTrack): AudioMetadata {
  return {
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artwork,
  };
}

export function createPlayerEngine(options: EngineOptions = {}): PlayerEngine {
  const { lockScreen = true, ownsLockScreen = true, releaseAudioSession = true } = options;

  let setupPromise: Promise<boolean> | null = null;
  let ready = false;
  let player: AudioPlayer | null = null;
  let statusSubscription: Subscription | null = null;

  /** Android reports `didJustFinish` on every tick while ended, so end once only. */
  let completionFired = false;
  /** Set while a source is loaded, so an idle player never reports as buffering. */
  let hasSource = false;
  /** The loaded track, kept so a stalled source can be reloaded. */
  let currentTrack: PlayableTrack | null = null;
  /** Bumped on every source swap and teardown, so work queued for an old source is dropped. */
  let sourceGeneration = 0;
  /**
   * Set once the current source has opened. AVPlayer throws on a seek before its
   * item is ready to play, so until then a seek waits in `pendingSeek`.
   */
  let sourceOpen = false;
  /** A position to apply once the source opens: a resume offset, an early seek, or a reload. */
  let pendingSeek: number | null = null;
  /** Playback was asked for while `pendingSeek` waited, so it starts once the seek lands. */
  let resumeAfterSeek = false;

  // Last values handed to subscribers, so an idle player emits nothing.
  let lastPosition = -1;
  let lastDuration = -1;
  let lastIsPlaying = false;
  let lastIsBuffering = false;

  let watchdog: ReturnType<typeof setInterval> | null = null;
  /** The listener wants sound: set by `play`, cleared by `pause`, the end, or a pause from outside the app. */
  let wantsPlayback = false;
  /** Where a reload resumes: the last real position, or a seek target not yet confirmed. */
  let resumeTarget = 0;
  /** The last duration known for this source, for the progress a reload or failure reports. */
  let knownDuration = 0;
  /** A seek made during playback, until playback is seen moving on from its target. */
  let seekCheck: { target: number; at: number } | null = null;
  let watchedPosition = 0;
  let lastMovedAt = 0;
  let lastTickAt = 0;
  /** When the current run of unbroken progress began, or 0 while not moving. */
  let movingSince = 0;
  let recoveryAttempts = 0;

  const listenerSets = new Set<EngineListeners>();

  function emit<K extends keyof EngineListeners>(
    event: K,
    ...args: Parameters<NonNullable<EngineListeners[K]>>
  ) {
    for (const listeners of listenerSets) {
      const handler = listeners[event] as ((...a: unknown[]) => void) | undefined;
      handler?.(...args);
    }
  }

  function reportPlayback(isPlaying: boolean, isBuffering: boolean) {
    if (isPlaying === lastIsPlaying && isBuffering === lastIsBuffering) return;

    lastIsPlaying = isPlaying;
    lastIsBuffering = isBuffering;
    emit('onPlaybackChange', { isPlaying, isBuffering });
  }

  function pushProgress() {
    if (!player) return;

    try {
      const position = safeSeconds(player.currentTime);
      const duration = safeSeconds(player.duration);

      lastPosition = position;
      lastDuration = duration;
      emit('onProgress', { position, duration });
    } catch {
      // The player can be torn down between reads; the next status update recovers.
    }
  }

  /** The native player's state now, rather than as of the last event, which can lag a swap. */
  function liveStatus(current: AudioPlayer): AudioStatus | null {
    try {
      return current.currentStatus;
    } catch {
      return null;
    }
  }

  function liveIsLoaded(current: AudioPlayer): boolean {
    try {
      return current.isLoaded;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------- watchdog

  /** Measures progress afresh from `position`, e.g. after a seek or a reload. */
  function restartWatch(position: number) {
    watchedPosition = position;
    lastMovedAt = Date.now();
    lastTickAt = lastMovedAt;
    movingSince = 0;
  }

  function startWatching() {
    if (watchdog) return;
    lastTickAt = Date.now();
    watchdog = setInterval(checkPlayback, WATCHDOG_INTERVAL_MS);
  }

  function stopWatching() {
    if (watchdog) clearInterval(watchdog);
    watchdog = null;
    seekCheck = null;
  }

  function seekLanded(check: { target: number; at: number }, position: number, now: number) {
    const elapsed = (now - check.at) / 1000;
    return (
      position >= check.target - SEEK_LANDING_TOLERANCE_SECONDS &&
      position <= check.target + elapsed + SEEK_LANDING_TOLERANCE_SECONDS
    );
  }

  function checkPlayback() {
    const current = player;
    if (!current || !hasSource || !wantsPlayback) {
      stopWatching();
      return;
    }

    const now = Date.now();
    // Timers stop while the app is suspended and can fire late on a busy JS
    // thread. A gap that long says nothing about the player, so start afresh.
    const resumedLate = now - lastTickAt > WATCHDOG_INTERVAL_MS * 3;
    lastTickAt = now;

    const status = liveStatus(current);
    if (!status) return;

    const phase = phaseOf(status);
    const position = safeSeconds(status.currentTime);

    if (resumedLate) {
      restartWatch(position);
      return;
    }

    // The finish itself is reported by the status event that carries it.
    if (phase === 'ended') {
      stopWatching();
      return;
    }

    const waitingOnSeek = pendingSeek !== null || resumeAfterSeek;

    if (phase === 'paused' && !waitingOnSeek) {
      // Loaded and not buffering: paused from outside the app — the lock
      // screen, a headset, a call. Nothing is stuck. Playing again re-arms this.
      wantsPlayback = false;
      stopWatching();
      return;
    }

    if (phase === 'playing') {
      if (Math.abs(position - watchedPosition) > PROGRESS_EPSILON_SECONDS) {
        if (seekCheck && !seekLanded(seekCheck, position, now)) {
          handleStall('did not resume at the seek position');
          return;
        }

        seekCheck = null;
        watchedPosition = position;
        lastMovedAt = now;
        if (!movingSince) movingSince = now;
        if (now - movingSince >= RECOVERY_RESET_MS) recoveryAttempts = 0;
        return;
      }

      movingSince = 0;
      if (now - lastMovedAt >= STALL_TIMEOUT_MS) handleStall('stopped moving while playing');
      return;
    }

    movingSince = 0;
    const allowance = phase === 'idle' ? IDLE_TIMEOUT_MS : BUFFERING_TIMEOUT_MS;
    if (now - lastMovedAt >= allowance) {
      handleStall(phase === 'idle' ? 'went idle' : 'was stuck buffering');
    }
  }

  /** Reloads a stuck source where it should be, or gives up once the budget is spent. */
  function handleStall(reason: string) {
    if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
      void giveUp(reason);
      return;
    }

    recoveryAttempts += 1;
    console.warn(
      `[player] playback ${reason}; reloading at ${Math.round(resumeTarget)}s ` +
        `(attempt ${recoveryAttempts} of ${MAX_RECOVERY_ATTEMPTS})`
    );
    reload(resumeTarget);
  }

  /**
   * Opens the current source afresh and plays once it lands on `seconds`.
   * `replace` is the only thing that makes ExoPlayer fetch again after a failed
   * load, and it gives AVPlayer a new item on iOS.
   */
  function reload(seconds: number) {
    const current = player;
    const track = currentTrack;
    if (!current || !track) return;

    try {
      current.pause();
      current.replace(track.url);
    } catch (error) {
      console.warn('[player] reload failed', error);
      void giveUp('could not be reloaded');
      return;
    }

    sourceGeneration += 1;
    sourceOpen = false;
    completionFired = false;
    pendingSeek = Math.max(0, seconds);
    resumeAfterSeek = true;
    seekCheck = null;
    resumeTarget = pendingSeek;
    restartWatch(pendingSeek);

    reportPlayback(false, true);
    lastPosition = pendingSeek;
    lastDuration = knownDuration;
    emit('onProgress', { position: pendingSeek, duration: knownDuration });
  }

  /** Out of retries: say so, show where a retry would resume, and release the dead player. */
  async function giveUp(reason: string) {
    console.warn(`[player] playback ${reason} and could not be recovered`);

    const position = resumeTarget;
    const duration = knownDuration;
    wantsPlayback = false;
    stopWatching();

    emit('onProgress', { position, duration });
    emit('onPlaybackFailed');
    // A fresh native player is the likeliest to work on the next attempt, and a
    // dead one must not keep holding the lock screen and the audio session.
    await teardown(false);
  }

  // ------------------------------------------------------------------ status

  /** Lands a waiting seek once the source has opened, then starts playback if it was asked for. */
  async function applyPendingSeek(duration: number) {
    const current = player;
    if (!current || pendingSeek === null) return;

    const target = duration > 0 ? Math.min(pendingSeek, duration) : pendingSeek;
    const generation = sourceGeneration;
    pendingSeek = null;
    resumeTarget = target;
    restartWatch(target);

    try {
      await current.seekTo(target);
      // Superseded while the seek ran: a new source, a teardown, or a pause.
      if (generation !== sourceGeneration || !resumeAfterSeek) return;

      resumeAfterSeek = false;
      if (wantsPlayback) current.play();
    } catch (error) {
      console.warn('[player] could not start at the saved position', error);
      if (generation !== sourceGeneration) return;

      resumeAfterSeek = false;
      if (wantsPlayback) handleStall('could not seek to the saved position');
    }
  }

  function handleStatus(status: AudioStatus) {
    const phase = phaseOf(status);
    const isPlaying = phase === 'playing';
    // Only real buffering shows the spinner, which includes a source still
    // opening. Idle with a source loaded is a failed load, not a slow one, and
    // is left to the watchdog; reporting it as buffering kept the spinner up
    // forever. Playback held back for a resume seek still counts as buffering.
    const isBuffering =
      hasSource && (phase === 'buffering' || (resumeAfterSeek && phase !== 'idle'));
    reportPlayback(isPlaying, isBuffering);

    if (isPlaying && hasSource && !wantsPlayback) {
      // Started from outside the app, from the lock screen or notification.
      wantsPlayback = true;
      restartWatch(safeSeconds(status.currentTime));
      startWatching();
    }

    // Checked against the live player too: an event queued just before a swap
    // still describes the previous source.
    if (
      !sourceOpen &&
      hasSource &&
      player &&
      (phase === 'ended' || (status.isLoaded && liveIsLoaded(player)))
    ) {
      sourceOpen = true;
    }

    const duration = safeSeconds(status.duration);
    if (duration > 0) knownDuration = duration;

    if (pendingSeek !== null) {
      // The position shown stays on the target until the seek lands.
      if (sourceOpen) void applyPendingSeek(duration);
      return;
    }

    const position = safeSeconds(status.currentTime);
    if (isPlaying && !seekCheck) resumeTarget = position;

    if (position !== lastPosition || duration !== lastDuration) {
      lastPosition = position;
      lastDuration = duration;
      emit('onProgress', { position, duration });
    }

    if (status.didJustFinish && !completionFired) {
      completionFired = true;
      wantsPlayback = false;
      stopWatching();
      emit('onTrackEnd');
    }
  }

  function ensurePlayer(): AudioPlayer {
    if (player) return player;

    player = createAudioPlayer(null, { updateInterval: STATUS_INTERVAL_MS });
    statusSubscription = player.addListener('playbackStatusUpdate', handleStatus);

    return player;
  }

  function resetBookkeeping() {
    hasSource = false;
    currentTrack = null;
    completionFired = false;
    sourceOpen = false;
    pendingSeek = null;
    resumeAfterSeek = false;
    wantsPlayback = false;
    resumeTarget = 0;
    knownDuration = 0;
    recoveryAttempts = 0;
    lastPosition = -1;
    lastDuration = -1;
    lastIsPlaying = false;
    lastIsBuffering = false;
  }

  /**
   * Frees a native player one step at a time, so a step that throws can never
   * skip the ones after it. All of them once sat in a single `try`, and the call
   * in the middle always threw, which left every torn-down player registered
   * and alive.
   *
   * There is no "clear the source" step. Native `replace` takes a source that
   * cannot be null: expo-audio's typings allow it, but both platforms reject it,
   * so `replace(null)` failed on every teardown. Nothing needs it: `release()`
   * is what frees the player. `remove()` only unregisters it from the module (on
   * Android the ExoPlayer lives on until it is released), and `release()` detaches
   * the object, so it goes last and nothing may touch the player after it.
   */
  function disposePlayer(current: AudioPlayer) {
    const steps: [string, () => void][] = [['pause', () => current.pause()]];

    if (lockScreen) {
      // Both are intentional: clearLockScreenControls clears now-playing state,
      // while the explicit false mirrors the activation in `load`. The first only
      // acts if this player holds the lock screen; the second would clear another
      // player's, so a non-owner leaves it out. Clearing comes before `release`,
      // which would otherwise drop the whole media session if this player held it.
      steps.push(['clearLockScreenControls', () => current.clearLockScreenControls()]);
      if (ownsLockScreen) {
        steps.push(['setActiveForLockScreen(false)', () => current.setActiveForLockScreen(false)]);
      }
    }

    steps.push(['remove', () => current.remove()], ['release', () => current.release()]);

    for (const [name, step] of steps) {
      try {
        step();
      } catch (error) {
        console.warn(`[player] native teardown failed at ${name}`, error);
      }
    }
  }

  /**
   * Fully releases the native player and media session. `createAudioPlayer` is
   * intentionally not lifecycle-managed by React, so every owner teardown must
   * call this explicitly.
   */
  async function teardown(emitResetProgress: boolean) {
    const current = player;

    // Make concurrent calls observe the player as unavailable before touching
    // the native object. A future setup/load will create a fresh player.
    player = null;
    ready = false;
    setupPromise = null;
    wantsPlayback = false;
    sourceGeneration += 1;
    stopWatching();

    statusSubscription?.remove();
    statusSubscription = null;

    if (current) disposePlayer(current);

    if (releaseAudioSession) {
      try {
        // Releases audio focus / the iOS audio session after the player is gone.
        await setIsAudioActiveAsync(false);
      } catch (error) {
        console.warn('[player] audio session teardown failed', error);
      }
    }

    resetBookkeeping();
    emit('onPlaybackChange', { isPlaying: false, isBuffering: false });
    if (emitResetProgress) {
      emit('onProgress', { position: 0, duration: 0 });
    }
  }

  async function setup(): Promise<boolean> {
    if (setupPromise) return setupPromise;

    setupPromise = (async () => {
      try {
        // The audio session has to be stated before anything plays: without it
        // the silent switch and the background keep-alive both default to off.
        // `doNotMix` takes the audio focus that the media session needs to own
        // the lock screen.
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
          allowsRecording: false,
        });
        await setIsAudioActiveAsync(true);

        ensurePlayer();
        ready = true;
        return true;
      } catch (error) {
        // Most often the native module is missing because the app is running in
        // Expo Go, which means playback is unavailable for this session.
        console.warn('[player] setup failed', error);
        // Cleared so a later attempt — a fast refresh, or a retry — can succeed.
        setupPromise = null;
        ready = false;
        return false;
      }
    })();

    return setupPromise;
  }

  return {
    setup,
    isAvailable: () => true,
    hasSource: () => hasSource,

    load: async (track: PlayableTrack, startAtSeconds = 0) => {
      if (!(await setup())) return;

      const current = ensurePlayer();

      sourceGeneration += 1;
      currentTrack = track;
      completionFired = false;
      sourceOpen = false;
      // A start offset can only be applied once the new source has opened.
      pendingSeek = startAtSeconds > 0 ? startAtSeconds : null;
      resumeAfterSeek = false;
      resumeTarget = Math.max(0, startAtSeconds);
      knownDuration = safeSeconds(track.duration);
      recoveryAttempts = 0;
      wantsPlayback = false;
      stopWatching();
      lastPosition = -1;
      lastDuration = -1;

      // `replace` keeps playing when the old source was playing, and the provider
      // decides when playback starts, so pause first and let it call `play`.
      current.pause();
      current.replace(track.url);
      hasSource = true;

      if (lockScreen) {
        const remoteArtwork = track.artwork;
        const isRemote = !!remoteArtwork && /^https?:\/\//i.test(remoteArtwork);
        const artworkCache = isRemote ? getArtworkCache() : null;
        const localArtwork =
          artworkCache && remoteArtwork ? artworkCache.cached(remoteArtwork) : null;

        current.setActiveForLockScreen(
          true,
          toMetadata(localArtwork ? { ...track, artwork: localArtwork } : track),
          LOCK_SCREEN_OPTIONS
        );

        // First play of this cover: the remote URL above shows it right away,
        // and the saved copy replaces it as soon as it lands, so a fetch that
        // failed natively is retried and the next play never needs the network.
        if (artworkCache && remoteArtwork && !localArtwork) {
          const generation = sourceGeneration;
          void artworkCache
            .fetch(remoteArtwork)
            .then((uri) => {
              if (!uri || player !== current || generation !== sourceGeneration) return;
              current.updateLockScreenMetadata(toMetadata({ ...track, artwork: uri }));
            })
            .catch((error) => console.warn('[player] lock screen artwork update failed', error));
        }
      }

      // The screens show the new track's position before the source reports in.
      emit('onProgress', {
        position: resumeTarget,
        duration: knownDuration,
      });
    },

    play: async () => {
      if (!ready || !player) return;
      const current = player;

      // Asked for by the listener, so an earlier failure starts over with a full budget.
      recoveryAttempts = 0;
      wantsPlayback = true;
      restartWatch(lastPosition >= 0 ? lastPosition : resumeTarget);
      startWatching();

      if (hasSource && pendingSeek === null) {
        const status = liveStatus(current);
        if (status && phaseOf(status) === 'idle') {
          // It failed while paused, and ExoPlayer will not fetch again by itself.
          reload(resumeTarget);
          return;
        }
      }

      if (pendingSeek !== null && !sourceOpen) {
        // A resume offset or an early seek is still waiting for the source to
        // open; starting now would play from the wrong place until it lands.
        resumeAfterSeek = true;
        return;
      }

      current.play();
    },

    pause: async () => {
      if (!ready || !player) return;

      wantsPlayback = false;
      resumeAfterSeek = false;
      stopWatching();
      player.pause();
    },

    /** Full stop that preserves provider progress for its resume offer. */
    stop: async () => {
      await teardown(false);
    },

    /** The full teardown: nothing is playing and nothing is on the lock screen. */
    reset: async () => {
      await teardown(true);
    },

    seekTo: async (seconds: number) => {
      if (!ready || !player) return;
      const current = player;

      const duration = safeSeconds(current.duration);
      const target = Math.max(0, duration > 0 ? Math.min(seconds, duration) : seconds);

      // Scrubbing away from the end arms the completion callback again.
      completionFired = false;
      resumeTarget = target;
      // Asked for by the listener, so it gets a full recovery budget.
      recoveryAttempts = 0;

      if (!sourceOpen) {
        // AVPlayer throws on a seek before its item is ready to play, so the
        // target waits for the source to open, as a resume offset does. Playing
        // on meanwhile would start from the wrong place, so that waits too.
        pendingSeek = target;
        if (wantsPlayback && !resumeAfterSeek) {
          resumeAfterSeek = true;
          current.pause();
        }
        lastPosition = target;
        emit('onProgress', { position: target, duration: knownDuration });
        return;
      }

      pendingSeek = null;
      if (wantsPlayback) {
        // Confirmed by the watchdog once playback is seen moving on from here.
        seekCheck = { target, at: Date.now() };
        restartWatch(target);
        startWatching();
      }

      try {
        await current.seekTo(target);
      } catch (error) {
        console.warn('[player] seek failed', error);
        if (player === current && wantsPlayback) handleStall('rejected a seek');
        return;
      }
      pushProgress();
    },

    setVolume: async (level: number) => {
      if (!ready || !player) return;
      // A property write, so the sleep timer's fade steps never reload the source.
      player.volume = Math.min(1, Math.max(0, level));
    },

    getProgress: async () => {
      if (!ready || !player) return { position: 0, duration: 0 };

      return {
        position: safeSeconds(player.currentTime),
        duration: safeSeconds(player.duration),
      };
    },

    subscribe: (listeners: EngineListeners) => {
      listenerSets.add(listeners);
      return () => {
        listenerSets.delete(listeners);
      };
    },

    /**
     * The Focus end tone is a one shot UI sound on its own short lived player, so
     * it never touches the lock screen or replaces the current soundscape.
     */
    playEndTone: async () => {
      try {
        const tone = createAudioPlayer(require('@/assets/audio/end-tone.wav'), {
          // Leaves the shared audio session up, so ending the chime cannot cut
          // anything else short. It is never made active for the lock screen.
          keepAudioSessionActive: true,
        });
        tone.volume = END_TONE_VOLUME;

        let released = false;
        let subscription: Subscription | null = null;
        let failsafe: ReturnType<typeof setTimeout> | null = null;

        const release = () => {
          if (released) return;
          released = true;

          if (failsafe) clearTimeout(failsafe);
          subscription?.remove();
          // Deferred so the player is not freed from inside its own event.
          setTimeout(() => tone.remove(), 0);
        };

        subscription = tone.addListener('playbackStatusUpdate', (status) => {
          if (status.didJustFinish) release();
        });
        failsafe = setTimeout(release, END_TONE_FAILSAFE_MS);

        tone.play();
      } catch (error) {
        console.warn('[player] end tone failed', error);
      }
    },
  };
}

/** The app-wide engine, subscribed to by `PlayerProvider`. */
export const engine: PlayerEngine = createPlayerEngine();
