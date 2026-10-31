/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const track = (id, mode = 'focus') => ({
  id, title: 'Sound ' + id, artwork_url: 'https://example.test/' + id + '.jpg',
  file_url: 'https://example.test/' + id + '.mp3', duration_seconds: 180, mode, is_loop: false,
});
const tracks = ['a', 'b', 'c'].map((id) => track(id));

test('overlapping sound selections only load the newest request after setup resolves', async () => {
  const player = createPlayer();
  await player.settle();
  let resolveA, resolveB;
  const first = new Promise((resolve) => { resolveA = resolve; });
  const second = new Promise((resolve) => { resolveB = resolve; });
  let count = 0;
  player.engine.setup = () => ++count === 1 ? first : second;
  const a = player.act('playSoundscape', tracks[0]);
  const b = player.act('playSoundscape', tracks[1]);
  resolveB(true);
  await b;
  resolveA(true);
  await a;
  assert.deepEqual(player.calls.loads.map((item) => item.track.id), ['b']);
  assert.equal(player.state.soundscape.id, 'b');
  assert.equal(player.state.isPlaying, true);
});

test('a late play rejection for A cannot overwrite the successful state of B', async () => {
  const player = createPlayer();
  await player.settle();
  let rejectA;
  const first = new Promise((resolve, reject) => { rejectA = reject; });
  const originalPlay = player.engine.play;
  let count = 0;
  player.engine.play = () => ++count === 1 ? first : originalPlay();
  const a = player.act('playSoundscape', tracks[0]);
  await player.settle();
  await player.act('playSoundscape', tracks[1]);
  rejectA(new Error('late native failure for A'));
  await a;
  assert.equal(player.state.soundscape.id, 'b');
  assert.equal(player.state.error, null);
  assert.equal(player.state.isPlaying, true);
});

// Run the actual provider with deterministic hooks, audio events and time.
// This needs no native runtime, test-renderer package, network, or real timers.
function createPlayer({
  saved = null, catalogue = tracks, hasSession = false, seekError = null,
  storedLoopEnabled, localSettingsFail = false, playStarts = true,
  guestMode = false, guestSaved = null,
  playbackSettings = {
    background_playback: true,
    default_timer_minutes: null,
    fade_enabled: true,
    end_behaviour: 'silent',
    quality: 'standard',
    autoplay_next: true,
  },
} = {}) {
  const hooks = [];
  const timers = new Map();
  const listeners = new Set();
  const warnings = [];
  const calls = {
    loads: [], seeks: [], saves: [], history: [], volumes: [], stop: 0, reset: 0,
    subscribes: 0, setups: 0, loopEnabled: [], backgroundPlayback: [], localSettingWrites: [],
    guestStorageWrites: [], guestStorageRemovals: [],
  };
  let storedGuest = guestSaved === null ? null : JSON.stringify(guestSaved);
  let storedLoop = storedLoopEnabled;
  let hookIndex = 0;
  let dirty = true;
  let now = 100000;
  let timerId = 0;
  let sourceLoaded = false;
  let background;
  let effects = [];
  const equalDeps = (a, b) => a && b && a.length === b.length && a.every((value, index) => Object.is(value, b[index]));
  const memo = (factory, deps) => {
    const index = hookIndex++;
    if (!hooks[index] || !equalDeps(hooks[index].deps, deps)) hooks[index] = { value: factory(), deps };
    return hooks[index].value;
  };
  const react = {
    createContext: (value) => {
      const context = { value };
      context.Provider = { context };
      return context;
    },
    useContext: (context) => context.value,
    useState: (initial) => {
      const index = hookIndex++;
      if (!hooks[index]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.set = (next) => {
          const value = typeof next === 'function' ? next(slot.value) : next;
          if (!Object.is(slot.value, value)) { slot.value = value; dirty = true; }
        };
        hooks[index] = slot;
      }
      return [hooks[index].value, hooks[index].set];
    },
    useRef: (initial) => {
      const index = hookIndex++;
      hooks[index] ??= { current: initial };
      return hooks[index];
    },
    useMemo: memo,
    useCallback: (callback, deps) => memo(() => callback, deps),
    useEffect: (effect, deps) => {
      const index = hookIndex++;
      if (!hooks[index] || !equalDeps(hooks[index].deps, deps)) {
        const previous = hooks[index];
        hooks[index] = { deps, cleanup: previous?.cleanup };
        effects.push(() => {
          previous?.cleanup?.();
          hooks[index].cleanup = effect();
        });
      }
    },
  };
  const emit = (event, value) => { for (const listener of listeners) listener[event]?.(value); };
  let currentTrackId = null;
  const engine = {
    setup: async () => { calls.setups++; return true; },
    hasSource: () => sourceLoaded,
    subscribe: (listener) => { calls.subscribes++; listeners.add(listener); return () => listeners.delete(listener); },
    load: async (value, startAt) => {
      sourceLoaded = true;
      currentTrackId = value.id;
      calls.loads.push({ track: value, startAt });
      emit('onProgress', { position: startAt, duration: value.duration, trackId: currentTrackId });
    },
    play: async () => emit('onPlaybackChange', playStarts
      ? { isPlaying: true, isBuffering: false }
      : { isPlaying: false, isBuffering: true }),
    pause: async () => emit('onPlaybackChange', { isPlaying: false, isBuffering: false }),
    stop: async () => { calls.stop++; sourceLoaded = false; emit('onPlaybackChange', { isPlaying: false, isBuffering: false }); },
    reset: async () => {
      calls.reset++;
      sourceLoaded = false;
      currentTrackId = null;
      emit('onPlaybackChange', { isPlaying: false, isBuffering: false });
      emit('onProgress', { position: 0, duration: 0, trackId: null });
    },
    seekTo: async (seconds) => {
      calls.seeks.push(seconds);
      if (seekError) throw seekError;
      emit('onProgress', { position: seconds, duration: 180, trackId: currentTrackId });
    },
    setVolume: async (level) => { calls.volumes.push(level); },
    setBackgroundPlayback: async (enabled) => { calls.backgroundPlayback.push(enabled); },
    setLoopEnabled: (enabled) => { calls.loopEnabled.push(enabled); },
  };
  const cache = new Map();
  const schedule = (callback, delay, interval) => {
    const id = ++timerId;
    timers.set(id, { callback, at: now + delay, interval });
    return id;
  };
  const networkListeners = new Set();
  let networkState = { type: 'WIFI', isConnected: true, isInternetReachable: true };
  const stubs = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': { Platform: { OS: 'android' }, AppState: { addEventListener: (_, callback) => { background = callback; return { remove: () => { background = null; } }; } } },
    // The playback health monitor (lib/player/playbackHealth.ts) reads this
    // only to tell "actually offline" from "buffering is slow" — never a
    // speed guess from connection type (audit M-NET-1). Mirrors the stub in
    // scripts/player-engine.test.cjs, with a settable state for tests below.
    'expo-network': {
      NetworkStateType: { CELLULAR: 'CELLULAR', WIFI: 'WIFI', UNKNOWN: 'UNKNOWN' },
      getNetworkStateAsync: async () => networkState,
      addNetworkStateListener: (listener) => {
        networkListeners.add(listener);
        return { remove: () => networkListeners.delete(listener) };
      },
    },
    '@/hooks/useSession': {
      useHasSession: () => hasSession,
      useGuestModeActive: () => guestMode,
    },
    '@react-native-async-storage/async-storage': {
      __esModule: true,
      default: {
        getItem: async () => storedGuest,
        setItem: async (key, value) => {
          storedGuest = value;
          calls.guestStorageWrites.push({ key, value: JSON.parse(value) });
        },
        removeItem: async (key) => {
          storedGuest = null;
          calls.guestStorageRemovals.push(key);
        },
      },
    },
    '@/hooks/usePreferences': { usePlaybackSettings: () => ({ data: playbackSettings }) },
    '@/lib/api/preferences': { PLAYBACK_SETTING_DEFAULTS: {
      background_playback: true,
      default_timer_minutes: null,
      fade_enabled: true,
      end_behaviour: 'silent',
      quality: 'standard',
      autoplay_next: false,
    } },
    '@/lib/api/home': { homeApi: { soundscape: async (id) => catalogue.find((value) => value.id === id) ?? null } },
    '@/lib/api/player': { playerApi: {
      getState: async () => saved,
      saveState: async (value) => { calls.saves.push(value); },
      addPlayHistory: async (...args) => { calls.history.push(args); },
    } },
    '@/lib/query-client': {
      queryClient: {
        cancelQueries: async () => {},
        setQueryData: () => {},
      },
    },
    '@/lib/local-settings': {
      getLocalSetting: async (key, fallback) => {
        if (localSettingsFail || storedLoop === undefined) return fallback;
        return key === 'loop_enabled' ? storedLoop : fallback;
      },
      setLocalSetting: async (key, value) => {
        calls.localSettingWrites.push({ key, value });
        if (localSettingsFail) return;
        if (key === 'loop_enabled') storedLoop = value;
      },
      LOCAL_SETTING_KEYS: { loopEnabled: 'loop_enabled' },
      LOOP_ENABLED_DEFAULT: false,
    },
  };
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, {
      exports: module.exports, module,
      console: { ...console, warn: (...args) => warnings.push(args.map(String).join(' ')) },
      Date: class extends Date { static now() { return now; } },
      setTimeout: (callback, delay) => schedule(callback, delay, 0),
      clearTimeout: (id) => timers.delete(id),
      setInterval: (callback, delay) => schedule(callback, delay, delay),
      clearInterval: (id) => timers.delete(id),
      require: (name) => {
        if (name in stubs) return stubs[name];
        if (name === './engine') return { engine };
        const target = name.startsWith('@/') ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
        return load(target + '.ts');
      },
    }, { filename: file });
    cache.set(file, module.exports);
    return module.exports;
  }
  const provider = load(path.join(root, 'lib/player/PlayerProvider.tsx'));
  function publish(element) {
    if (!element) return;
    if (element.type?.context) element.type.context.value = element.props.value;
    publish(element.props?.children);
  }
  function render() {
    let count = 0;
    while (dirty) {
      assert.ok(count++ < 30, 'Hook harness exceeded render limit');
      dirty = false;
      hookIndex = 0;
      publish(provider.PlayerProvider({ children: null }));
      const pending = effects;
      effects = [];
      pending.forEach((effect) => effect());
    }
  }
  async function settle() {
    // Flush promises across the VM boundary, then effects from their renders.
    await new Promise(setImmediate);
    render();
    await new Promise(setImmediate);
    render();
  }
  render();
  return {
    calls,
    engine,
    warnings,
    get guestSaved() { return storedGuest === null ? null : JSON.parse(storedGuest); },
    settle,
    /** The engine's give-up, in its order: the resume position, the failure, then the released player. */
    async failPlayback(position) {
      emit('onProgress', { position, duration: 180, trackId: currentTrackId });
      emit('onPlaybackFailed');
      sourceLoaded = false;
      emit('onPlaybackChange', { isPlaying: false, isBuffering: false });
      await settle();
    },
    get state() { render(); return provider.usePlayerState(); },
    get progress() { render(); return provider.usePlayerProgress(); },
    async act(action, ...args) { await provider.usePlayerActions()[action](...args); await settle(); },
    async event(event, value) { emit(event, value); await settle(); },
    async background() { background?.('background'); await settle(); },
    async active() { background?.('active'); await settle(); },
    async elapse(milliseconds) { now += milliseconds; await settle(); },
    async setNetworkState(nextState) {
      networkState = { ...networkState, ...nextState };
      for (const listener of [...networkListeners]) listener(networkState);
      await settle();
    },
    async advance(milliseconds) {
      const until = now + milliseconds;
      for (;;) {
        const next = [...timers].filter(([, value]) => value.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break;
        const [id, value] = next;
        now = value.at;
        if (value.interval) value.at += value.interval; else timers.delete(id);
        value.callback();
        await settle();
      }
      now = until;
      await settle();
    },
    async dispose() { hooks.forEach((slot) => slot.cleanup?.()); await settle(); },
  };
}
const ids = (queue) => Array.from(queue, (item) => item.id);

test('a single-track tap produces a one-item queue and cannot skip', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1]);
  await player.event('onProgress', { position: 20, duration: 180, trackId: 'b' });
  await player.act('skipNext');
  await player.act('skipPrevious');
  assert.deepEqual(ids(player.state.queue), ['b']);
  assert.equal(player.state.hasNext, false);
  assert.equal(player.state.hasPrevious, false);
  assert.equal(player.progress.position, 20);
  assert.equal(player.calls.loads.length, 1);
  assert.equal(player.calls.seeks.length, 0);
});

test('a Play All-style full queue keeps every track and advances without wrapping', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  assert.equal(player.state.queueIndex, 1);
  assert.equal(player.state.hasPrevious, true);
  assert.equal(player.state.hasNext, true);
  await player.event('onProgress', { position: 20, duration: 180, trackId: 'b' });
  await player.act('skipPrevious');
  assert.equal(player.state.soundscape.id, 'a');
  assert.equal(player.progress.position, 0);
  assert.equal(player.state.hasPrevious, false);
  await player.act('skipPrevious');
  assert.equal(player.calls.loads.length, 2);
  await player.act('skipNext');
  await player.act('skipNext');
  assert.equal(player.state.soundscape.id, 'c');
  assert.equal(player.state.soundscape.artwork_url, tracks[2].artwork_url);
  assert.equal(player.state.hasNext, false);
  await player.act('skipNext');
  assert.deepEqual(player.calls.loads.map((call) => call.track.id), ['b', 'a', 'b', 'c']);
  assert.deepEqual(player.calls.loads.map((call) => call.track.title), ['Sound b', 'Sound a', 'Sound b', 'Sound c']);
});

test('queue is a stable snapshot, deduplicates history, and contains the picked item', async () => {
  const player = createPlayer();
  const list = [tracks[0], tracks[1], tracks[0]];
  await player.act('playSoundscape', tracks[1], { queue: list });
  list.reverse();
  list.pop();
  assert.deepEqual(ids(player.state.queue), ['a', 'b']);
  assert.equal(player.state.queueIndex, 1);
  await player.act('playSoundscape', tracks[2], { queue: list });
  assert.equal(player.state.queue[player.state.queueIndex].id, 'c');
  assert.deepEqual(ids(player.state.queue), ['c', 'a', 'b']);
});

test('save and stop preserve progress, while resume restores the full saved queue and timer', async () => {
  const player = createPlayer({ hasSession: true });
  await player.settle();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  await player.act('seek', 12);
  await player.act('setTimer', 10);
  await player.advance(900);
  assert.deepEqual(Array.from(player.calls.saves.at(-1).queue), ['a', 'b', 'c']);
  assert.equal(player.calls.saves.at(-1).soundscape_id, 'b');
  await player.act('togglePlayPause');
  assert.deepEqual(ids(player.state.resumable.queue), ['a', 'b', 'c']);
  await player.act('stop');
  assert.equal(player.state.soundscape, null);
  await player.act('resume');
  assert.equal(player.state.soundscape.id, 'b');
  // M-2: resume restores the whole saved queue (not just the one track), so
  // next/previous work again, with the current track at its original index.
  assert.deepEqual(ids(player.state.queue), ['a', 'b', 'c']);
  assert.equal(player.state.queueIndex, 1);
  assert.equal(player.calls.loads.at(-1).startAt, 12);
  assert.equal(player.state.timerSelection, 10);
  await player.act('skipNext');
  assert.equal(player.state.soundscape.id, 'c');
  await player.background();
  assert.equal(player.calls.saves.at(-1).soundscape_id, 'c');
});

test('guest playback is saved locally without calling the account player-state API', async () => {
  const player = createPlayer({ guestMode: true });
  await player.settle();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  await player.act('seek', 37);
  await player.act('setTimer', 10);
  await player.background();

  assert.equal(player.calls.saves.length, 0);
  assert.equal(player.guestSaved.soundscape.id, 'b');
  assert.deepEqual(ids(player.guestSaved.queue), ['a', 'b', 'c']);
  assert.equal(player.guestSaved.positionSeconds, 37);
  assert.equal(player.guestSaved.durationSeconds, 180);
  assert.equal(player.guestSaved.timerMinutes, 10);
});

test('a guest relaunch restores the locally saved Continue Listening state', async () => {
  const player = createPlayer({
    guestMode: true,
    guestSaved: {
      soundscape: tracks[1],
      queue: tracks,
      positionSeconds: 52,
      durationSeconds: 180,
      timerMinutes: null,
      savedAt: new Date(0).toISOString(),
    },
  });
  await player.settle();

  assert.equal(player.state.resumable.soundscape.id, 'b');
  assert.deepEqual(ids(player.state.resumable.queue), ['a', 'b', 'c']);
  assert.equal(player.state.resumable.positionSeconds, 52);

  await player.act('resume');
  assert.equal(player.calls.loads.at(-1).track.id, 'b');
  assert.equal(player.calls.loads.at(-1).startAt, 52);
});

test('forgetting a guest session removes its locally saved player state', async () => {
  const player = createPlayer({ guestMode: true });
  await player.act('playSoundscape', tracks[0]);
  await player.act('seek', 24);
  await player.background();
  assert.ok(player.guestSaved);

  await player.act('stop', { forgetResumable: true });
  assert.equal(player.guestSaved, null);
  assert.equal(player.calls.guestStorageRemovals.length, 1);
});

test('cold resume restores saved queue order, removes missing tracks and finds current index', async () => {
  const player = createPlayer({ hasSession: true, saved: {
    soundscape_id: 'b', queue: ['a', 'missing', 'b', 'c', 'a'],
    position_seconds: 25, duration_seconds: 180, timer_minutes: 10,
  } });
  await player.settle();
  assert.deepEqual(ids(player.state.resumable.queue), ['a', 'b', 'c']);
  await player.act('resume');
  // M-2: the cleaned, de-duplicated saved queue is restored in full, with the
  // current track found at its proper index, so skipNext advances to the next.
  assert.deepEqual(ids(player.state.queue), ['a', 'b', 'c']);
  assert.equal(player.state.queueIndex, 1);
  assert.equal(player.progress.position, 25);
  assert.equal(player.state.timerSelection, 10);
  await player.act('skipNext');
  assert.equal(player.state.soundscape.id, 'c');
});

test('natural completion advances, then stops at the end without wrapping', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  await player.event('onTrackEnd');
  assert.equal(player.state.soundscape.id, 'c');
  await player.event('onTrackEnd');
  assert.equal(player.calls.loads.length, 2);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.isPlaying, false);
});

test('playback preferences configure background audio and disable automatic queue advance', async () => {
  const player = createPlayer({
    playbackSettings: {
      background_playback: false,
      default_timer_minutes: null,
      fade_enabled: true,
      end_behaviour: 'silent',
      quality: 'standard',
      autoplay_next: false,
    },
  });
  await player.settle();

  assert.deepEqual(player.calls.backgroundPlayback, [false]);
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.event('onTrackEnd');

  assert.deepEqual(player.calls.loads.map(({ track: loaded }) => loaded.id), ['a']);
  assert.equal(player.calls.stop, 1);
});

test('a saved default timer is applied when a new listening session starts', async () => {
  const player = createPlayer({
    playbackSettings: {
      background_playback: true,
      default_timer_minutes: 30,
      fade_enabled: true,
      end_behaviour: 'silent',
      quality: 'standard',
      autoplay_next: false,
    },
  });

  await player.act('playSoundscape', tracks[0]);

  assert.equal(player.state.timerSelection, 30);
  assert.equal(player.progress.timerRemainingSeconds, 30 * 60);
});

test('turning fade off keeps full volume until the timer stops playback', async () => {
  const player = createPlayer({
    playbackSettings: {
      background_playback: true,
      default_timer_minutes: null,
      fade_enabled: false,
      end_behaviour: 'silent',
      quality: 'standard',
      autoplay_next: false,
    },
  });

  await player.act('playSoundscape', track('sleep', 'sleep'));
  await player.act('setTimer', 1);
  await player.advance(60_000);

  assert.equal(player.calls.volumes.some((level) => level < 1), false);
  assert.equal(player.calls.stop, 1);
});

test('queue changes preserve the timer deadline', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 1);
  await player.advance(5000);
  assert.equal(player.progress.timerRemainingSeconds, 55);
  await player.act('skipNext');
  assert.equal(player.progress.timerRemainingSeconds, 55);
  await player.advance(55000);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.timerSelection, null);
});

test('an active Sleep fade starts one minute before the deadline, continues across Next, and ends on time', async () => {
  const sleepTracks = ['sleep-a', 'sleep-b'].map((id) => track(id, 'sleep'));
  const player = createPlayer();
  await player.act('playSoundscape', sleepTracks[0], { queue: sleepTracks });
  await player.act('setTimer', 2);
  await player.advance(59000);
  assert.equal(player.state.isFadingOut, false);
  await player.advance(1000);
  assert.equal(player.state.isFadingOut, true);
  const volumeCount = player.calls.volumes.length;
  await player.act('skipNext');
  assert.equal(player.state.isFadingOut, true);
  assert.equal(player.calls.volumes.length, volumeCount, 'Next must not reset the fade volume');
  await player.advance(60000);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.isPlaying, false);
  assert.equal(player.state.isFadingOut, false);
});

test('a five-minute Sleep timer fades only during its final minute and stops at the deadline', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', track('sleep-timer', 'sleep'));
  await player.act('setTimer', 5);

  await player.advance(239000);
  assert.equal(player.state.isFadingOut, false);
  await player.advance(1000);
  assert.equal(player.state.isFadingOut, true);
  assert.equal(player.progress.timerRemainingSeconds, 60);
  await player.advance(60000);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.timerSelection, null);
});

test('an expired timer is finalised immediately when AppState becomes active', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', track('background-sleep', 'sleep'));
  await player.act('setTimer', 5);

  await player.background();
  await player.elapse(301000);
  assert.equal(player.calls.stop, 0);
  await player.active();

  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.timerSelection, null);
  assert.equal(player.state.isFadingOut, false);
});

test('the engine wiring mounts once and is never torn down by re-renders, playback ticks or user actions', async () => {
  const player = createPlayer();
  // Mounting subscribes to the engine and sets it up exactly once. That effect is
  // what tears the native player down and builds it again, so it must only ever
  // re-run when the provider itself is unmounted and mounted again.
  assert.equal(player.calls.subscribes, 1);
  assert.equal(player.calls.reset, 0);

  await player.act('playSoundscape', tracks[0], { queue: tracks });
  for (let second = 1; second <= 60; second++) {
    await player.event('onProgress', { position: second, duration: 180, trackId: 'a' });
    await player.event('onPlaybackChange', { isPlaying: second % 2 === 0, isBuffering: second % 2 === 1 });
    await player.advance(1000);
  }
  await player.act('seek', 90);
  await player.act('togglePlayPause');
  await player.act('togglePlayPause');
  await player.act('skipNext');
  await player.background();
  assert.equal(player.state.soundscape.id, 'b');
  assert.ok(player.progress.duration > 0);

  assert.equal(player.calls.subscribes, 1, 'the engine effect re-ran: the provider would rebuild the native player');
  assert.equal(player.calls.reset, 0, 'the engine effect was cleaned up: the provider would tear the native player down');
  await player.dispose();
  assert.equal(player.calls.reset, 1, 'unmounting the provider still releases the native player, once');
});

test('provider unmount still resets the engine and media-session owner', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  assert.equal(player.calls.reset, 0);
  await player.dispose();
  assert.equal(player.calls.reset, 1);
});

test('a playback failure shows a retryable error, and playing again retries from where it stopped', async () => {
  const player = createPlayer({ hasSession: true });
  await player.settle();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  await player.act('seek', 90);
  await player.failPlayback(90);

  // Neither frozen as "playing" nor spinning: stopped, explained, and retryable.
  assert.equal(player.state.isPlaying, false);
  assert.equal(player.state.isBuffering, false);
  assert.equal(player.state.canRetry, true);
  assert.match(player.state.error, /try again/i);
  assert.equal(player.progress.position, 90);
  // Saved like a pause, so Continue Listening and a relaunch resume there too.
  assert.equal(player.state.resumable.positionSeconds, 90);
  assert.equal(player.calls.saves.at(-1).position_seconds, 90);

  await player.act('togglePlayPause');
  assert.equal(player.calls.loads.length, 2);
  assert.equal(player.calls.loads.at(-1).track.id, 'b');
  assert.equal(player.calls.loads.at(-1).startAt, 90);
  assert.equal(player.state.isPlaying, true);
  assert.equal(player.state.error, null);
  assert.equal(player.state.canRetry, false);
});

test('a seek the engine rejects is contained, and the requested position stays on screen', async () => {
  const player = createPlayer({ seekError: new Error('native seek failed') });
  await player.act('playSoundscape', tracks[0]);
  await player.act('seek', 42);
  assert.deepEqual(player.calls.seeks, [42]);
  assert.equal(player.progress.position, 42);
  assert.match(player.warnings.join('\n'), /seek failed/);
  assert.equal(player.state.error, null);
});

test('errors that retrying cannot fix are not offered a retry', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', { ...tracks[0], file_url: null });
  assert.equal(player.state.error, 'This soundscape has no audio file yet.');
  assert.equal(player.state.canRetry, false);
});

// ------------------------------------------------------------------- loop

const loopable = (base) => ({ ...base, is_loop: true });

test('the loop preference defaults to off and is applied to the engine on mount', async () => {
  const player = createPlayer();
  await player.settle();
  assert.equal(player.state.loopEnabled, false);
  assert.equal(player.calls.loopEnabled.at(-1), false);
});

test('a loop preference saved from a previous launch is restored on mount', async () => {
  const player = createPlayer({ storedLoopEnabled: true });
  await player.settle();
  assert.equal(player.state.loopEnabled, true);
  assert.equal(player.calls.loopEnabled.at(-1), true);
});

test('a saved loop preference that cannot be read falls back to off', async () => {
  const player = createPlayer({ storedLoopEnabled: true, localSettingsFail: true });
  await player.settle();
  assert.equal(player.state.loopEnabled, false);
});

test('setLoopEnabled updates state, applies to the engine live, and persists the choice', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  const loadCount = player.calls.loads.length;

  await player.act('setLoopEnabled', true);
  assert.equal(player.state.loopEnabled, true);
  assert.equal(player.calls.loopEnabled.at(-1), true);
  assert.equal(player.calls.loads.length, loadCount, 'toggling the preference must never reload the source');
  assert.deepEqual(player.calls.localSettingWrites.at(-1), { key: 'loop_enabled', value: true });

  await player.act('setLoopEnabled', false);
  assert.equal(player.state.loopEnabled, false);
  assert.deepEqual(player.calls.localSettingWrites.at(-1), { key: 'loop_enabled', value: false });
});

test('the loop preference survives stop, unlike the rest of playback state', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await player.act('setLoopEnabled', true);
  await player.act('stop');
  assert.equal(player.state.soundscape, null);
  assert.equal(player.state.loopEnabled, true);
});

test('a timer longer than the remaining loopable track auto-enables loop and notices the listener', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', loopable(tracks[1]));
  await player.event('onProgress', { position: 170, duration: 180, trackId: 'b' });

  await player.act('setTimer', 60);
  assert.equal(player.state.loopEnabled, true);
  assert.match(player.state.loopNotice.text, /loop turned on/i);
  assert.equal(player.calls.loopEnabled.at(-1), true);
});

test('a timer shorter than the remaining track leaves the loop preference untouched', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', loopable(tracks[1]));
  await player.event('onProgress', { position: 10, duration: 180, trackId: 'b' });

  await player.act('setTimer', 1);
  assert.equal(player.state.loopEnabled, false);
  assert.equal(player.state.loopNotice, null);
});

test('a long timer on a non-loopable track does not touch the loop preference', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1]);
  await player.event('onProgress', { position: 170, duration: 180, trackId: 'b' });

  await player.act('setTimer', 60);
  assert.equal(player.state.loopEnabled, false);
  assert.equal(player.state.loopNotice, null);
});

test('turning loop off with a timer that will outlast the track hints that playback will stop early', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', loopable(tracks[1]));
  await player.act('setLoopEnabled', true);
  await player.act('setTimer', 60);
  await player.event('onProgress', { position: 170, duration: 180, trackId: 'b' });

  await player.act('setLoopEnabled', false);
  assert.equal(player.state.loopEnabled, false, 'turning it off is allowed, not blocked');
  assert.match(player.state.loopNotice.text, /stop when this track ends/i);
});

test('turning loop off is silent when the running timer does not outlast the track', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', loopable(tracks[1]));
  await player.act('setLoopEnabled', true);
  await player.act('setTimer', 1);
  await player.event('onProgress', { position: 10, duration: 180, trackId: 'b' });

  await player.act('setLoopEnabled', false);
  assert.equal(player.state.loopEnabled, false);
  assert.equal(player.state.loopNotice, null);
});

// -------------------------------------------------------- bug 1: track resets

test("a new track always starts at position 0, never the previous track's position", async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await player.event('onProgress', { position: 600, duration: 180, trackId: 'a' });
  assert.equal(player.progress.position, 600);

  await player.act('playSoundscape', tracks[1]);
  assert.equal(player.progress.position, 0);
  assert.equal(player.calls.loads.at(-1).startAt, 0);

  // A stale progress event for the old track — e.g. a network-recovery reload
  // that was already in flight when the new track was requested — must not
  // be allowed to move the new track off zero.
  await player.event('onProgress', { position: 600, duration: 180, trackId: 'a' });
  assert.equal(player.progress.position, 0);
  assert.equal(player.state.soundscape.id, 'b');
});

test('rapid A -> B -> C taps each start at 0, and a stale event for an earlier tap never lands', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await player.event('onProgress', { position: 600, duration: 180, trackId: 'a' });

  await player.act('playSoundscape', tracks[1]);
  await player.event('onProgress', { position: 45, duration: 180, trackId: 'b' });

  await player.act('playSoundscape', tracks[2]);
  assert.equal(player.state.soundscape.id, 'c');
  assert.equal(player.progress.position, 0);

  await player.event('onProgress', { position: 600, duration: 180, trackId: 'a' });
  await player.event('onProgress', { position: 45, duration: 180, trackId: 'b' });
  assert.equal(player.progress.position, 0);
  assert.deepEqual(player.calls.loads.map((call) => call.track.id), ['a', 'b', 'c']);
});

// ------------------------------------------------ bug 2: timer cancel rules

test('starting a different soundscape cancels an active timer and restores volume', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 10);
  assert.equal(player.state.timerSelection, 10);

  await player.act('playSoundscape', tracks[2]);
  assert.equal(player.state.timerSelection, null);
  assert.equal(player.progress.timerRemainingSeconds, null);
  assert.equal(player.calls.volumes.at(-1), 1);
});

test('starting a different queue (Play All) cancels the timer even when it begins on the same track', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await player.act('setTimer', 10);
  assert.equal(player.state.timerSelection, 10);

  // A different queue context, even one that happens to start on the same track.
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  assert.equal(player.state.timerSelection, null);
});

test("the old timer's deadline never fires on the new track once cancelled", async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 5);
  await player.act('playSoundscape', tracks[2]);

  const stopsBefore = player.calls.stop;
  await player.advance(5 * 60 * 1000 + 5000);
  assert.equal(player.calls.stop, stopsBefore, 'the cancelled deadline must never fire on the new track');
  assert.equal(player.state.isPlaying, true);
  assert.equal(player.state.timerSelection, null);
});

test('re-tapping the same soundscape and queue does not cancel the timer', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  await player.act('setTimer', 10);
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  assert.equal(player.state.timerSelection, 10);
});

test('toggling play/pause on the current track does not cancel the timer', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await player.act('setTimer', 10);
  await player.act('togglePlayPause');
  await player.act('togglePlayPause');
  assert.equal(player.state.timerSelection, 10);
});

test('explicit Next and Previous within the same queue do not cancel the timer', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  await player.act('setTimer', 10);
  await player.act('skipNext');
  assert.equal(player.state.timerSelection, 10);
  await player.act('skipPrevious');
  assert.equal(player.state.timerSelection, 10);
  await player.act('skipPrevious');
  assert.equal(player.state.timerSelection, 10);
});

test('loop auto-enabled by a timer is never persisted, and reverts when a different track cancels the timer', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', loopable(tracks[1]));
  await player.event('onProgress', { position: 170, duration: 180, trackId: 'b' });
  await player.act('setTimer', 60);
  assert.equal(player.state.loopEnabled, true);
  assert.equal(
    player.calls.localSettingWrites.some((write) => write.key === 'loop_enabled'),
    false,
    'auto-enabling loop for a timer must never be saved as the user preference'
  );

  await player.act('playSoundscape', tracks[2]);
  assert.equal(player.state.loopEnabled, false, 'the session-only auto-enable reverts with the timer');
  assert.equal(player.calls.loopEnabled.at(-1), false);
});

// -------------------------------------------------- bug 3: pause freezes timer

test('a timer selected during initial buffering waits for actual playback before counting down', async () => {
  const player = createPlayer({ playStarts: false });
  await player.act('playSoundscape', tracks[0]);
  assert.equal(player.state.isPlaying, false);
  assert.equal(player.state.isBuffering, true);

  await player.act('setTimer', 5);
  assert.equal(player.progress.timerRemainingSeconds, 300);
  await player.advance(30000);
  assert.equal(player.progress.timerRemainingSeconds, 300, 'buffering time is not timer time');

  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  await player.advance(10000);
  assert.equal(player.progress.timerRemainingSeconds, 290);
});

test('pausing freezes the remaining time, and resuming reschedules the deadline from there', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 10);
  await player.advance(60000);
  assert.equal(player.progress.timerRemainingSeconds, 540);

  await player.act('togglePlayPause');
  assert.equal(player.state.isPlaying, false);
  assert.equal(player.state.timerSelection, 10, 'the timer stays visible, just paused');
  assert.equal(player.progress.timerRemainingSeconds, 540);

  // Real time passing while paused must not count against the timer.
  await player.advance(20000);
  assert.equal(player.progress.timerRemainingSeconds, 540);

  await player.act('togglePlayPause');
  assert.equal(player.state.isPlaying, true);
  assert.equal(player.progress.timerRemainingSeconds, 540);

  await player.advance(10000);
  assert.equal(player.progress.timerRemainingSeconds, 530);
});

test('pausing cancels a scheduled fade, and resuming inside the fade window resumes at the matching volume with no pop', async () => {
  const player = createPlayer();
  const sleepTrack = track('sleep-pause', 'sleep');
  await player.act('playSoundscape', sleepTrack);
  await player.act('setTimer', 5);

  // Enter the final minute, where Sleep/Relax fades (FADE_OUT_SECONDS = 60).
  await player.advance(239000);
  assert.equal(player.state.isFadingOut, false);
  await player.advance(1000);
  assert.equal(player.state.isFadingOut, true);
  assert.equal(player.progress.timerRemainingSeconds, 60);

  // 30s further into the fade: volume should be about half.
  await player.advance(30000);
  assert.equal(player.progress.timerRemainingSeconds, 30);

  const volumeCallsAtPause = player.calls.volumes.length;
  await player.act('togglePlayPause');
  assert.equal(player.state.isFadingOut, false, 'a frozen timer is not shown as fading');
  assert.equal(player.progress.timerRemainingSeconds, 30);

  // Nothing fades further, and the deadline cannot fire, while paused.
  await player.advance(120000);
  assert.equal(player.calls.volumes.length, volumeCallsAtPause, 'a paused timer must not keep fading');
  assert.equal(player.calls.stop, 0);

  await player.act('togglePlayPause');
  assert.equal(player.calls.volumes.at(-1), 0.5, '30s left of a 60s fade resumes at half volume, not a pop to full first');
  assert.equal(player.state.isFadingOut, true);

  await player.advance(30000);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.timerSelection, null);
});

test('a timer frozen by pausing for more than 30 minutes is dropped outright', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 10);
  await player.act('togglePlayPause');
  assert.equal(player.state.timerSelection, 10);

  await player.advance(30 * 60 * 1000 + 1000);
  assert.equal(player.state.timerSelection, null, 'a timer paused this long is cancelled outright');
  assert.equal(player.progress.timerRemainingSeconds, null);
  assert.equal(player.calls.stop, 0, 'cancelling a frozen timer is not the same as stopping playback');

  await player.act('togglePlayPause');
  assert.equal(player.state.isPlaying, true);
  assert.equal(player.state.timerSelection, null, 'playing again after the expiry starts with no timer');
});

test('the 5-minute Test timer (DEV preset) survives a pause and resume', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await player.act('setTimer', 5);
  await player.advance(60000);
  assert.equal(player.progress.timerRemainingSeconds, 240);

  await player.act('togglePlayPause');
  await player.advance(10000);
  assert.equal(player.progress.timerRemainingSeconds, 240, 'frozen while paused');

  await player.act('togglePlayPause');
  await player.advance(239000);
  assert.equal(player.calls.stop, 0);
  await player.advance(1000);
  assert.equal(player.calls.stop, 1);
});

test('Focus fades during its final minute and survives pause/resume', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', track('focus-timer', 'focus'));
  await player.act('setTimer', 2);

  await player.advance(59000);
  assert.equal(player.state.isFadingOut, false);
  await player.advance(1000);
  assert.equal(player.state.isFadingOut, true);
  assert.equal(player.progress.timerRemainingSeconds, 60);

  await player.advance(30000);
  assert.equal(player.progress.timerRemainingSeconds, 30);

  await player.act('togglePlayPause');
  assert.equal(player.state.isFadingOut, false);
  assert.equal(player.progress.timerRemainingSeconds, 30);
  await player.advance(30000);
  assert.equal(player.calls.stop, 0);

  await player.act('togglePlayPause');
  assert.equal(player.state.isFadingOut, true);

  await player.advance(30000);
  assert.equal(player.calls.stop, 1);
});

test('a timer frozen by pausing never fires across an AppState background/foreground cycle', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 5);
  await player.act('togglePlayPause');

  await player.background();
  await player.elapse(6 * 60 * 1000);
  assert.equal(player.calls.stop, 0);
  await player.active();
  assert.equal(player.calls.stop, 0, 'a frozen timer must not fire just because the app came back');
  assert.equal(player.state.timerSelection, 5);
});

test('an external pause (lock screen, a call, a headset) freezes the timer exactly like the in-app toggle', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 10);
  await player.advance(60000);
  assert.equal(player.progress.timerRemainingSeconds, 540);

  // Not through `togglePlayPause` — the engine itself reports playback stopped.
  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: false });
  await player.advance(30000);
  assert.equal(player.progress.timerRemainingSeconds, 540, 'frozen the same way an in-app pause would freeze it');

  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  await player.advance(10000);
  assert.equal(player.progress.timerRemainingSeconds, 530);
});

// ------------------------------------- adaptive connection hint (audit M-NET-1)
//
// lib/player/playbackHealth.ts replaces a single fixed buffering timeout
// with a rolling-window monitor fed from the engine listeners the provider
// already subscribes to. See scripts/playback-health.test.cjs for unit
// coverage of the monitor itself; these tests cover how PlayerProvider
// wires it in.

/** Advances past this track's own startup, as `confirmsPlayback` requires. */
async function confirmPlaybackStarted(player, track) {
  await player.event('onProgress', { position: 1, duration: track.duration_seconds, trackId: track.id });
}

test('initial startup buffering never shows a connection hint, however long it takes', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);

  // Still starting up: no confirmed playback yet. A long buffer here is a
  // CDN cold start or audio-session setup, not evidence of a problem.
  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: true });
  await player.advance(20000);
  assert.equal(player.state.error, null);

  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  assert.equal(player.state.error, null);
});

test('a single brief buffering episode after confirmed playback shows no hint', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: true });
  await player.advance(3000);
  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  await player.advance(10000);
  assert.equal(player.state.error, null);
});

test('repeated buffering after confirmed playback surfaces the interruptions message on the next episode', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  // Three 6s episodes: enough episodes and enough total time, but each one
  // stays silent while it is only buffering, not actively recovering.
  for (let i = 0; i < 3; i++) {
    await player.event('onPlaybackChange', { isPlaying: false, isBuffering: true });
    await player.advance(6000);
    await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  }
  assert.equal(player.state.error, null);

  // The next buffer already has enough prior evidence to surface the hint.
  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: true });
  assert.equal(player.state.error, 'Playback is experiencing interruptions.');
  assert.equal(player.state.canRetry, false);

  // It clears again once this episode ends too.
  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  assert.equal(player.state.error, null);
});

test('a second engine-confirmed recovery episode upgrades the message to interruptions', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Reconnecting...');
  await player.event('onRecoveryStateChange', { isRecovering: false });
  assert.equal(player.state.error, null);

  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Playback is experiencing interruptions.');
  assert.equal(player.state.canRetry, false);
});

test('a single recovery episode sustained past the threshold escalates on its own', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Reconnecting...');

  await player.advance(24000);
  assert.equal(player.state.error, 'Reconnecting...', 'not sustained yet');

  await player.advance(2000);
  assert.equal(player.state.error, 'Playback is experiencing interruptions.');
});

test('an active recovery during an actual disconnection shows the offline message', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  await player.setNetworkState({ isConnected: false, isInternetReachable: false });
  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Unable to connect. Please check your connection.');

  await player.setNetworkState({ isConnected: true, isInternetReachable: true });
  await player.event('onRecoveryStateChange', { isRecovering: false });
  assert.equal(player.state.error, null);
});

test('a new track resets the health monitor window', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  await player.event('onRecoveryStateChange', { isRecovering: true });
  await player.event('onRecoveryStateChange', { isRecovering: false });
  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Playback is experiencing interruptions.');
  await player.event('onRecoveryStateChange', { isRecovering: false });

  await player.act('playSoundscape', tracks[1]);
  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Reconnecting...', 'the new track starts with a clean window');
});

test('the connection hint never overrides a terminal, retryable error', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);
  await confirmPlaybackStarted(player, tracks[0]);

  await player.event('onRecoveryStateChange', { isRecovering: true });
  await player.event('onRecoveryStateChange', { isRecovering: false });
  await player.event('onRecoveryStateChange', { isRecovering: true });
  assert.equal(player.state.error, 'Playback is experiencing interruptions.');
  await player.event('onRecoveryStateChange', { isRecovering: false });

  await player.failPlayback(5);
  assert.equal(player.state.error, 'Playback stopped unexpectedly. Check your connection and try again.');
  assert.equal(player.state.canRetry, true);

  // A buffer starting while a terminal, retryable error is showing must not
  // be replaced by a connection hint.
  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: true });
  assert.equal(player.state.canRetry, true);
  assert.equal(player.state.error, 'Playback stopped unexpectedly. Check your connection and try again.');
});

test('recovery keeps the player loading across idle status events until audio resumes', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);

  await player.event('onRecoveryStateChange', { isRecovering: true });
  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: false });
  assert.equal(player.state.isRecovering, true, 'idle between retries must remain loading');

  // Native can claim "playing" before its clock moves; that must not end loading.
  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  assert.equal(player.state.isPlaying, true);
  assert.equal(player.state.isRecovering, true);

  // The engine emits this only after observing real position movement.
  await player.event('onRecoveryStateChange', { isRecovering: false });
  assert.equal(player.state.isRecovering, false);
  assert.equal(player.state.isBuffering, false, 'real playback switches the spinner to Pause');
});

test('the first idle event cannot flash Play before the first recovery attempt', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0]);

  await player.event('onPlaybackChange', { isPlaying: false, isBuffering: false });
  assert.equal(player.state.isPlaybackPending, true);

  // Even a premature native "playing" event is not confirmation by itself.
  await player.event('onPlaybackChange', { isPlaying: true, isBuffering: false });
  assert.equal(player.state.isPlaybackPending, true);

  await player.event('onProgress', {
    position: 1,
    duration: tracks[0].duration_seconds,
    trackId: tracks[0].id,
  });
  assert.equal(player.state.isPlaybackPending, false);
});

