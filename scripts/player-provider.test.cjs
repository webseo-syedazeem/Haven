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
  file_url: 'https://example.test/' + id + '.mp3', duration_seconds: 180, mode,
});
const tracks = ['a', 'b', 'c'].map((id) => track(id));

// Run the actual provider with deterministic hooks, audio events and time.
// This needs no native runtime, test-renderer package, network, or real timers.
function createPlayer({ saved = null, catalogue = tracks, hasSession = false, seekError = null } = {}) {
  const hooks = [];
  const timers = new Map();
  const listeners = new Set();
  const warnings = [];
  const calls = { loads: [], seeks: [], saves: [], history: [], volumes: [], stop: 0, reset: 0, tones: 0, subscribes: 0, setups: 0 };
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
  const engine = {
    setup: async () => { calls.setups++; return true; },
    hasSource: () => sourceLoaded,
    subscribe: (listener) => { calls.subscribes++; listeners.add(listener); return () => listeners.delete(listener); },
    load: async (value, startAt) => {
      sourceLoaded = true;
      calls.loads.push({ track: value, startAt });
      emit('onProgress', { position: startAt, duration: value.duration });
    },
    play: async () => emit('onPlaybackChange', { isPlaying: true, isBuffering: false }),
    pause: async () => emit('onPlaybackChange', { isPlaying: false, isBuffering: false }),
    stop: async () => { calls.stop++; sourceLoaded = false; emit('onPlaybackChange', { isPlaying: false, isBuffering: false }); },
    reset: async () => { calls.reset++; sourceLoaded = false; emit('onPlaybackChange', { isPlaying: false, isBuffering: false }); emit('onProgress', { position: 0, duration: 0 }); },
    seekTo: async (seconds) => {
      calls.seeks.push(seconds);
      if (seekError) throw seekError;
      emit('onProgress', { position: seconds, duration: 180 });
    },
    setVolume: async (level) => { calls.volumes.push(level); },
    playEndTone: async () => { calls.tones++; },
  };
  const cache = new Map();
  const schedule = (callback, delay, interval) => {
    const id = ++timerId;
    timers.set(id, { callback, at: now + delay, interval });
    return id;
  };
  const stubs = {
    react,
    'react/jsx-runtime': { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    'react-native': { Platform: { OS: 'android' }, AppState: { addEventListener: (_, callback) => { background = callback; return { remove: () => { background = null; } }; } } },
    '@/hooks/useSession': { useHasSession: () => hasSession },
    '@/lib/api/home': { homeApi: { soundscape: async (id) => catalogue.find((value) => value.id === id) ?? null } },
    '@/lib/api/player': { playerApi: {
      getState: async () => saved,
      saveState: async (value) => { calls.saves.push(value); },
      addPlayHistory: async (...args) => { calls.history.push(args); },
    } },
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
    warnings,
    settle,
    /** The engine's give-up, in its order: the resume position, the failure, then the released player. */
    async failPlayback(position) {
      emit('onProgress', { position, duration: 180 });
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

test('a standalone soundscape cannot skip or restart even after three seconds', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1]);
  await player.event('onProgress', { position: 20, duration: 180 });
  await player.act('skipNext');
  await player.act('skipPrevious');
  assert.deepEqual(ids(player.state.queue), ['b']);
  assert.equal(player.state.hasNext, false);
  assert.equal(player.state.hasPrevious, false);
  assert.equal(player.progress.position, 20);
  assert.equal(player.calls.loads.length, 1);
  assert.equal(player.calls.seeks.length, 0);
});

test('context starts at the picked item and skips in order without wrapping', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[1], { queue: tracks });
  assert.equal(player.state.queueIndex, 1);
  assert.equal(player.state.hasPrevious, true);
  assert.equal(player.state.hasNext, true);
  await player.event('onProgress', { position: 20, duration: 180 });
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

test('save, pause, stop and in-session resume preserve the queue and position', async () => {
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
  assert.equal(player.state.queueIndex, 1);
  assert.equal(player.calls.loads.at(-1).startAt, 12);
  assert.equal(player.state.timerSelection, 10);
  await player.act('skipNext');
  await player.background();
  assert.equal(player.calls.saves.at(-1).soundscape_id, 'c');
  assert.equal(player.calls.saves.at(-1).position_seconds, 0);
});

test('cold resume restores saved queue order, removes missing tracks and finds current index', async () => {
  const player = createPlayer({ hasSession: true, saved: {
    soundscape_id: 'b', queue: ['a', 'missing', 'b', 'c', 'a'],
    position_seconds: 25, duration_seconds: 180, timer_minutes: 10,
  } });
  await player.settle();
  assert.deepEqual(ids(player.state.resumable.queue), ['a', 'b', 'c']);
  await player.act('resume');
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

test('queue changes preserve the timer deadline and Focus end tone', async () => {
  const player = createPlayer();
  await player.act('playSoundscape', tracks[0], { queue: tracks });
  await player.act('setTimer', 1);
  await player.act('setEndToneEnabled', true);
  await player.advance(5000);
  assert.equal(player.progress.timerRemainingSeconds, 55);
  await player.act('skipNext');
  assert.equal(player.progress.timerRemainingSeconds, 55);
  await player.advance(55000);
  assert.equal(player.calls.tones, 1);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.timerSelection, null);
});

test('an active Sleep fade continues across Next and ends playback', async () => {
  const sleepTracks = ['sleep-a', 'sleep-b'].map((id) => track(id, 'sleep'));
  const player = createPlayer();
  await player.act('playSoundscape', sleepTracks[0], { queue: sleepTracks });
  await player.act('setTimer', 1);
  await player.advance(61000);
  assert.equal(player.state.isFadingOut, true);
  const volumeCount = player.calls.volumes.length;
  await player.act('skipNext');
  assert.equal(player.state.isFadingOut, true);
  assert.equal(player.calls.volumes.length, volumeCount, 'Next must not reset the fade volume');
  await player.advance(59000);
  assert.equal(player.calls.stop, 1);
  assert.equal(player.state.isPlaying, false);
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
    await player.event('onProgress', { position: second, duration: 180 });
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
