/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const plain = (value) => JSON.parse(JSON.stringify(value));
const track = (id) => ({
  id, title: 'Soundscape ' + id, artist: 'Passage',
  url: 'https://example.test/' + id + '.mp3',
  artwork: 'https://example.test/' + id + '.jpg', duration: 180,
});

// An hour-long soundscape and the Android (ExoPlayer) states it moves through.
const hour = { ...track('hour'), duration: 3600 };
const playingAt = (currentTime) => ({
  playing: true, isLoaded: true, isBuffering: false, playbackState: 'ready', currentTime, duration: 3600,
});
const pausedAt = (currentTime) => ({
  playing: false, isLoaded: true, isBuffering: false, playbackState: 'ready', currentTime, duration: 3600,
});
const bufferingAt = (currentTime) => ({
  playing: false, isLoaded: false, isBuffering: true, playbackState: 'buffering', currentTime, duration: 3600,
});
// A failed load: ExoPlayer drops to idle and fetches nothing more by itself.
const idleAt = (currentTime) => ({
  playing: false, isLoaded: false, isBuffering: false, playbackState: 'idle', currentTime, duration: 3600,
});
const named = (calls, name) => calls.filter(([call]) => call === name);

function createEngineHarness({ artworkCache = null } = {}) {
  const players = [];
  const audioModes = [];
  const audioActive = [];
  const warnings = [];
  const scheduled = new Map();
  const intervals = new Map();
  let nextTimeout = 1;
  let nextInterval = 1;
  let now = 1_000_000;
  const audio = {
    setAudioModeAsync: async (mode) => audioModes.push(mode),
    setIsAudioActiveAsync: async (active) => audioActive.push(active),
    createAudioPlayer(source, options) {
      const listeners = new Map();
      const calls = [];
      // What the native player reports right now. `emit` updates it and then
      // delivers the event, as a real status update does; `deliver` sends an
      // event alone, like one queued before a source swap that arrives after it.
      const live = {
        playing: false, isLoaded: false, isBuffering: false, playbackState: undefined,
        currentTime: 0, duration: 180, didJustFinish: false,
      };
      // A released shared object is detached from its native half, so any later
      // call or property read on it throws, as it does natively.
      const attached = () => {
        if (player.released) throw new Error('Cannot use a released shared object');
      };
      // `failing` names calls that throw, to exercise a native call going wrong.
      const call = (name, fn) => (...args) => {
        attached();
        if (player.failing.has(name)) throw new Error('native ' + name + ' failed');
        return fn(...args);
      };
      const player = {
        source, options, calls, live, volume: 1, seekError: null, released: false, failing: new Set(),
        get currentTime() { attached(); return live.currentTime; },
        set currentTime(value) { live.currentTime = value; },
        get duration() { attached(); return live.duration; },
        set duration(value) { live.duration = value; },
        get isLoaded() { attached(); return live.isLoaded; },
        get playing() { attached(); return live.playing; },
        get currentStatus() { attached(); return { ...live }; },
        addListener(event, callback) {
          listeners.set(event, callback);
          return { remove() {
            calls.push(['removeListener', event]);
            listeners.delete(event);
          } };
        },
        emit(status) {
          Object.assign(live, status);
          listeners.get('playbackStatusUpdate')?.(status);
        },
        deliver(status) {
          listeners.get('playbackStatusUpdate')?.(status);
        },
        pause: call('pause', () => calls.push(['pause'])),
        play: call('play', () => calls.push(['play'])),
        replace: call('replace', (nextSource) => {
          // expo-audio's typings allow null, but both native `replace` functions
          // take a source that cannot be, and reject it.
          if (nextSource == null) {
            throw new Error(`Call to function 'AudioPlayer.replace' has been rejected. `
              + `Caused by: The 2nd argument cannot be cast to type expo.modules.audio.AudioSource (received null)`);
          }
          player.source = nextSource;
          calls.push(['replace', nextSource]);
          // A new source starts out opening, as ExoPlayer and AVPlayer both do.
          Object.assign(live, { playing: false, isLoaded: false, isBuffering: true, playbackState: 'buffering', currentTime: 0 });
        }),
        setActiveForLockScreen: call('setActiveForLockScreen', (...args) => calls.push(['lockScreen', ...args])),
        updateLockScreenMetadata: call('updateLockScreenMetadata', (...args) => calls.push(['lockScreenUpdate', ...args])),
        clearLockScreenControls: call('clearLockScreenControls', () => calls.push(['clearLockScreen'])),
        remove: call('remove', () => calls.push(['remove'])),
        release: call('release', () => { calls.push(['release']); player.released = true; }),
        async seekTo(seconds) {
          attached();
          calls.push(['seek', seconds]);
          if (player.seekError) throw player.seekError;
          live.currentTime = seconds;
        },
      };
      players.push(player);
      return player;
    },
  };
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'lib/player/engine.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    console: { ...console, warn: (...args) => warnings.push(args.map(String).join(' ')) },
    Date: class extends Date { static now() { return now; } },
    require(id) {
      if (id === 'expo-audio') return audio;
      if (id === '@/assets/audio/end-tone.wav') return 'end-tone.wav';
      if (id === './types') return { getArtworkCache: () => artworkCache };
      throw new Error('Unexpected engine dependency: ' + id);
    },
    setTimeout(callback, delay) {
      const id = nextTimeout++;
      scheduled.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => scheduled.delete(id),
    setInterval(callback, delay) {
      const id = nextInterval++;
      intervals.set(id, { callback, delay, at: now + delay });
      return id;
    },
    clearInterval: (id) => intervals.delete(id),
  });
  // Settles promises across the VM boundary, like a seek resolving natively.
  const flush = () => new Promise(setImmediate);
  return {
    engine: module.exports.engine, createPlayerEngine: module.exports.createPlayerEngine,
    players, audioModes, audioActive, scheduled, warnings, flush,
    runTimeouts(delay) {
      for (const [id, timeout] of [...scheduled]) {
        if (timeout.delay !== delay) continue;
        scheduled.delete(id);
        timeout.callback();
      }
    },
    /** Moves the clock on, firing each interval when it falls due. */
    async advance(milliseconds) {
      const until = now + milliseconds;
      for (;;) {
        await flush();
        const due = [...intervals.values()]
          .filter((timer) => timer.at <= until)
          .sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        now = due.at;
        due.at += due.delay;
        due.callback();
      }
      now = until;
      await flush();
    },
  };
}

test('queue loads replace audio, lock-screen metadata and progress on the same native player', async () => {
  const { engine, players } = createEngineHarness();
  const progress = [];
  engine.subscribe({ onProgress: (value) => progress.push(plain(value)) });
  // Initial selection, Next, then Previous use the same engine load path.
  for (const [index, item] of [track('a'), track('b'), track('a')].entries()) {
    await engine.load(item);
    const native = players[0];
    assert.equal(named(native.calls, 'lockScreen').length, index === 0 ? 0 : 1,
      'loading alone never starts the foreground media service');
    await engine.play();
    assert.equal(players.length, 1);
    assert.equal(native.source, item.url);
    const metadata = index === 0
      ? named(native.calls, 'lockScreen').at(-1)
      : named(native.calls, 'lockScreenUpdate').at(-1);
    assert.deepEqual(plain(metadata), [
      index === 0 ? 'lockScreen' : 'lockScreenUpdate',
      ...(index === 0 ? [true] : []),
      { title: item.title, artist: item.artist, artworkUrl: item.artwork },
      ...(index === 0 ? [{ showSeekForward: true, showSeekBackward: true }] : []),
    ]);
    assert.deepEqual(progress.at(-1), { position: 0, duration: 180 });
    assert.deepEqual(native.calls.at(-1), ['play']);
  }
  assert.equal(named(players[0].calls, 'lockScreen').length, 1,
    'track changes reuse the existing foreground media service');
});

test('resume seeks after loading and track completion fires once per source', async () => {
  const { engine, players } = createEngineHarness();
  let ended = 0;
  engine.subscribe({ onTrackEnd: () => ended++ });
  await engine.load(track('a'), 23);
  const native = players[0];
  const status = { playing: true, isBuffering: false, isLoaded: true, currentTime: 0, duration: 180 };
  native.emit(status);
  native.emit({ ...status, currentTime: 23 });
  assert.deepEqual(native.calls.filter(([name]) => name === 'seek'), [['seek', 23]]);
  native.emit({ ...status, currentTime: 180, didJustFinish: true });
  native.emit({ ...status, currentTime: 180, didJustFinish: true });
  assert.equal(ended, 1);
  await engine.load(track('b'));
  native.emit({ ...status, currentTime: 180, didJustFinish: true });
  assert.equal(ended, 2);
});

test('background setup remains enabled and reset releases media controls and audio session', async () => {
  const { engine, players, audioModes, audioActive } = createEngineHarness();
  const progress = [];
  engine.subscribe({ onProgress: (value) => progress.push(plain(value)) });
  await engine.load(track('a'));
  assert.deepEqual(plain(audioModes), [{
    playsInSilentMode: true, shouldPlayInBackground: true,
    interruptionMode: 'doNotMix', allowsRecording: false,
  }]);
  assert.deepEqual(audioActive, [true]);
  await engine.reset();
  assert.equal(engine.hasSource(), false);
  assert.equal(players[0].released, true);
  assert.deepEqual(players[0].calls.slice(-4), [
    ['removeListener', 'playbackStatusUpdate'], ['pause'], ['remove'], ['release'],
  ]);
  assert.deepEqual(audioActive, [true, false]);
  assert.deepEqual(progress.at(-1), { position: 0, duration: 0 });
  await engine.load(track('b'));
  assert.equal(players.length, 2);
  assert.equal(players[1].source, track('b').url);
  assert.deepEqual(audioActive, [true, false, true]);
});

test('stop preserves resume progress and volume fade does not replace the active source', async () => {
  const { engine, players } = createEngineHarness();
  const progress = [];
  engine.subscribe({ onProgress: (value) => progress.push(plain(value)) });
  await engine.load(track('a'));
  await engine.seekTo(42);
  const replacements = players[0].calls.filter(([name]) => name === 'replace').length;
  await engine.setVolume(0.5);
  assert.equal(players[0].volume, 0.5);
  await engine.setVolume(-0.1);
  assert.equal(players[0].volume, 0);
  assert.equal(players[0].calls.filter(([name]) => name === 'replace').length, replacements);
  await engine.stop();
  assert.deepEqual(progress.at(-1), { position: 42, duration: 180 });
  assert.equal(engine.hasSource(), false);
});

test('end tone uses a separate player without replacing soundscape or lock-screen metadata', async () => {
  const { engine, players, scheduled, runTimeouts } = createEngineHarness();
  await engine.load(track('a'));
  const soundscapeCalls = players[0].calls.length;
  await engine.playEndTone();
  assert.equal(players.length, 2);
  const tone = players[1];
  assert.equal(tone.source, 'end-tone.wav');
  assert.equal(tone.options.keepAudioSessionActive, true);
  assert.equal(tone.volume, 0.7);
  assert.equal(players[0].calls.length, soundscapeCalls);
  assert.equal(tone.calls.some(([name]) => name === 'lockScreen'), false);
  assert.deepEqual(tone.calls.at(-1), ['play']);
  tone.emit({ didJustFinish: true });
  runTimeouts(0);
  assert.deepEqual(tone.calls.at(-1), ['remove']);
  assert.equal(scheduled.size, 0);
});

test('a scoped engine keeps its own player and listeners and leaves the lock screen and shared session alone', async () => {
  const { engine, createPlayerEngine, players, audioActive } = createEngineHarness();
  const scoped = createPlayerEngine({ lockScreen: false, releaseAudioSession: false });
  const appProgress = [];
  const scopedProgress = [];
  engine.subscribe({ onProgress: (value) => appProgress.push(plain(value)) });
  scoped.subscribe({ onProgress: (value) => scopedProgress.push(plain(value)) });
  await scoped.load(track('a'));
  await scoped.play();
  assert.equal(players.length, 1);
  assert.equal(players[0].source, track('a').url);
  assert.deepEqual(scopedProgress.at(-1), { position: 0, duration: 180 });
  assert.deepEqual(appProgress, []);
  await scoped.reset();
  const names = players[0].calls.map(([name]) => name);
  assert.equal(names.includes('lockScreen') || names.includes('clearLockScreen'), false);
  assert.equal(names.at(-1), 'release');
  assert.deepEqual(audioActive, [true]);
  await engine.load(track('b'));
  assert.equal(players.length, 2);
  assert.equal(players[1].source, track('b').url);
});

test('a scoped engine with lock screen on activates once, updates tracks, and clears only its controls', async () => {
  const { createPlayerEngine, players, audioActive } = createEngineHarness();
  const scoped = createPlayerEngine({
    lockScreen: true, ownsLockScreen: false, releaseAudioSession: false,
  });
  const lockScreenCalls = () => players[0].calls.filter(([name]) => name === 'lockScreen');
  await scoped.load(track('a'));
  await scoped.play();
  // Switching card updates metadata without re-arming the foreground service.
  await scoped.load(track('b'));
  await scoped.play();
  assert.equal(players.length, 1);
  assert.deepEqual(plain(lockScreenCalls()), [
    ['lockScreen', true,
      { title: 'Soundscape a', artist: 'Passage', artworkUrl: track('a').artwork },
      { showSeekForward: true, showSeekBackward: true }],
  ]);
  assert.deepEqual(plain(named(players[0].calls, 'lockScreenUpdate').at(-1)), [
    'lockScreenUpdate',
    { title: 'Soundscape b', artist: 'Passage', artworkUrl: track('b').artwork },
  ]);
  await scoped.reset();
  const names = players[0].calls.map(([name]) => name);
  assert.ok(names.includes('clearLockScreen'));
  // `setActiveForLockScreen(false)` would clear a lock screen held by another player.
  assert.equal(lockScreenCalls().length, 1);
  assert.equal(names.at(-1), 'release');
  assert.deepEqual(audioActive, [true]);
});

test('teardown frees the native player without replacing its source, and raises no warning', async () => {
  const { engine, players, audioActive, warnings } = createEngineHarness();
  await engine.load(track('a'));
  await engine.play();
  await engine.reset();

  // `replace(null)` is rejected natively, so it can never be part of a teardown.
  assert.equal(plain(players[0].calls).some(([name, source]) => name === 'replace' && source == null), false);
  assert.deepEqual(plain(players[0].calls.slice(-5)), [
    ['pause'], ['clearLockScreen'], ['lockScreen', false], ['remove'], ['release'],
  ]);
  assert.equal(players[0].released, true);
  assert.deepEqual(warnings, []);
  assert.deepEqual(audioActive, [true, false]);

  // Every kind of teardown ends the same way, and none of them warns.
  await engine.load(track('b'));
  await engine.stop();
  assert.equal(players[1].released, true);
  assert.deepEqual(plain(players[1].calls.slice(-2)), [['remove'], ['release']]);
  assert.deepEqual(warnings, []);
});

test('a teardown step that fails cannot skip the steps after it, or the audio session release', async () => {
  const { engine, players, audioActive, warnings } = createEngineHarness();
  await engine.load(track('a'));
  await engine.play();
  players[0].failing.add('clearLockScreenControls');
  players[0].failing.add('pause');
  await engine.reset();

  // Both failures are reported, by name, and nothing after them was skipped.
  assert.equal(warnings.length, 2);
  assert.match(warnings[0], /native teardown failed at pause/);
  assert.match(warnings[1], /native teardown failed at clearLockScreenControls/);
  assert.deepEqual(plain(players[0].calls.slice(-3)), [['lockScreen', false], ['remove'], ['release']]);
  assert.equal(players[0].released, true);
  assert.deepEqual(audioActive, [true, false]);
});

test('an engine torn down and set up again builds one native player per round, and frees each one', async () => {
  const { engine, players } = createEngineHarness();
  await engine.setup();
  assert.equal(players.length, 1);

  // Ten rounds of the provider unmounting and mounting again, with nothing playing.
  for (let round = 0; round < 10; round++) {
    await engine.reset();
    await engine.setup();
  }
  assert.equal(players.length, 11);
  assert.equal(players.filter((native) => native.released).length, 10, 'every player torn down is freed');
  assert.equal(players.at(-1).released, false);

  // Setting up again while one is live reuses it: creation is not driven by setup calls alone.
  await engine.setup();
  await engine.setup();
  assert.equal(players.length, 11);
});

test('native config retains background audio and Android swipe-close service teardown', () => {
  // Expo reads app.json as JSON5, which allows a leading byte order mark.
  const raw = fs.readFileSync(path.join(root, 'app.json'), 'utf8').replace(/^﻿/, '');
  const config = JSON.parse(raw).expo;
  assert.ok(config.ios.infoPlist.UIBackgroundModes.includes('audio'));
  assert.ok(config.android.permissions.includes('android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK'));
  assert.ok(config.plugins.includes('./plugins/with-expo-audio-stop-with-app'));
  const application = {};
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'plugins/with-expo-audio-stop-with-app.js'), 'utf8'), {
    module, exports: module.exports,
    require(id) {
      assert.equal(id, 'expo/config-plugins');
      return {
        AndroidConfig: { Manifest: { getMainApplicationOrThrow: () => application } },
        withAndroidManifest: (value, callback) => callback(value),
      };
    },
  });
  module.exports({ modResults: {} });
  module.exports({ modResults: {} });
  assert.equal(application.service.length, 1);
  assert.equal(application.service[0].$['android:name'], 'expo.modules.audio.service.AudioControlsService');
  assert.equal(application.service[0].$['android:stopWithTask'], 'true');
});

// ------------------------------------------------------------ stall recovery

/** Loads the hour-long track and has it open and playing at `at` seconds. */
async function startPlaying(harness, at = 5) {
  await harness.engine.load(hour);
  await harness.engine.play();
  const native = harness.players[0];
  native.emit(playingAt(at));
  return native;
}

function watch(engine) {
  const seen = { changes: [], progress: [], failures: 0 };
  engine.subscribe({
    onPlaybackChange: (value) => seen.changes.push(plain(value)),
    onProgress: (value) => seen.progress.push(plain(value)),
    onPlaybackFailed: () => seen.failures++,
  });
  return seen;
}

test('a normal seek lands natively at once, with no reload and no extra native calls', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);
  const before = native.calls.length;

  await harness.engine.seekTo(1200);
  assert.deepEqual(native.calls.slice(before), [['seek', 1200]]);
  assert.deepEqual(seen.progress.at(-1), { position: 1200, duration: 3600 });

  // ExoPlayer rebuffers briefly at the new offset, then plays on from it.
  native.emit(bufferingAt(1200));
  await harness.advance(1000);
  for (let second = 1; second <= 8; second++) {
    native.emit(playingAt(1200 + second));
    await harness.advance(1000);
  }
  assert.deepEqual(native.calls.slice(before), [['seek', 1200]]);
  assert.equal(seen.failures, 0);
  assert.deepEqual(harness.warnings, []);
});

test('a seek that leaves the native player idle is reloaded at the seek target and resumes there', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);

  await harness.engine.seekTo(1200);
  // The seek is accepted, then the load at the new offset fails.
  native.emit(idleAt(1200));
  assert.deepEqual(seen.changes.at(-1), { isPlaying: false, isBuffering: false },
    'idle with a source loaded is a failure, not buffering');

  await harness.advance(1000);
  assert.equal(named(native.calls, 'replace').length, 1, 'given a moment first');
  await harness.advance(1000);
  assert.deepEqual(plain(named(native.calls, 'replace')), [['replace', hour.url], ['replace', hour.url]]);
  assert.deepEqual(seen.changes.at(-1), { isPlaying: false, isBuffering: true });
  assert.deepEqual(seen.progress.at(-1), { position: 1200, duration: 3600 });
  assert.match(harness.warnings[0], /went idle; reloading at 1200s \(attempt 1 of 2\)/);

  // The fresh source opens: the target lands first, and only then does it play.
  const reloaded = native.calls.length;
  native.emit(pausedAt(0));
  await harness.flush();
  assert.deepEqual(native.calls.slice(reloaded), [['seek', 1200], ['play']]);

  for (let second = 1; second <= 6; second++) {
    native.emit(playingAt(1200 + second));
    await harness.advance(1000);
  }
  assert.deepEqual(seen.changes.at(-1), { isPlaying: true, isBuffering: false });
  assert.equal(named(native.calls, 'replace').length, 2);
  assert.equal(named(native.calls, 'lockScreen').length, 1,
    'same-track recovery never re-arms the foreground media service');
  assert.equal(seen.failures, 0);
});

test('a player that reports playing but never moves is reloaded where it stood', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);

  // Claims to be playing, but the position is frozen at 40.
  native.emit(playingAt(40));
  await harness.advance(4000);
  assert.equal(named(native.calls, 'replace').length, 1);
  await harness.advance(1000);
  assert.equal(named(native.calls, 'replace').length, 2);
  assert.deepEqual(seen.progress.at(-1), { position: 40, duration: 3600 });
  assert.match(harness.warnings[0], /stopped moving while playing; reloading at 40s/);
});

test('recovery is bounded: after two failed reloads the failure is reported once and the player released', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);

  await harness.engine.seekTo(1200);
  native.emit(idleAt(1200));
  await harness.advance(2000);
  // Each fresh load of that offset fails the same way.
  native.emit(idleAt(0));
  await harness.advance(2000);
  native.emit(idleAt(0));
  assert.equal(seen.failures, 0);
  await harness.advance(2000);

  assert.equal(seen.failures, 1);
  assert.equal(harness.engine.hasSource(), false);
  // The load and two reloads. The teardown releasing the dead player replaces nothing.
  assert.deepEqual(plain(named(native.calls, 'replace')),
    [['replace', hour.url], ['replace', hour.url], ['replace', hour.url]]);
  assert.deepEqual(plain(native.calls.slice(-2)), [['remove'], ['release']]);
  assert.equal(native.released, true);
  // The bar shows where a retry resumes rather than a frozen or runaway position.
  assert.deepEqual(seen.progress.at(-1), { position: 1200, duration: 3600 });
  assert.deepEqual(seen.changes.at(-1), { isPlaying: false, isBuffering: false });
  assert.match(harness.warnings.at(-1), /went idle and could not be recovered/);

  // Nothing keeps retrying afterwards.
  const settled = native.calls.length;
  await harness.advance(60_000);
  assert.equal(native.calls.length, settled);
  assert.equal(seen.failures, 1);
  assert.equal(harness.players.length, 1);

  // A later play or load starts over on a fresh native player.
  await harness.engine.load(hour, 1200);
  assert.equal(harness.players.length, 2);
});

test('slow buffering after a seek is given time rather than treated as a failure', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);

  await harness.engine.seekTo(1200);
  native.emit(bufferingAt(1200));
  await harness.advance(8000);
  assert.equal(named(native.calls, 'replace').length, 1);
  assert.deepEqual(seen.changes.at(-1), { isPlaying: false, isBuffering: true });

  for (let second = 1; second <= 5; second++) {
    native.emit(playingAt(1200 + second));
    await harness.advance(1000);
  }
  assert.equal(named(native.calls, 'replace').length, 1);
  assert.deepEqual(harness.warnings, []);
});

test('buffering that never ends is treated as stuck once its allowance runs out', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);

  await harness.engine.seekTo(1200);
  native.emit(bufferingAt(1200));
  await harness.advance(9000);
  assert.equal(named(native.calls, 'replace').length, 1);
  await harness.advance(1000);
  assert.equal(named(native.calls, 'replace').length, 2);
  assert.match(harness.warnings[0], /was stuck buffering; reloading at 1200s/);
});

test('a pause from outside the app is left alone, and playing again re-arms the watchdog', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const calls = native.calls.length;

  // Paused from the lock screen, a headset or a call: loaded, idle-free, not playing.
  native.emit(pausedAt(5));
  await harness.advance(20_000);
  assert.equal(native.calls.length, calls);

  // Played again from the lock screen, then stalls: that is caught as usual.
  native.emit(playingAt(6));
  await harness.advance(5000);
  assert.equal(named(native.calls, 'replace').length, 2);
});

test('pausing in the app stops the watchdog, so a paused player is never reloaded', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  await harness.engine.pause();
  native.emit(pausedAt(5));
  await harness.advance(60_000);
  assert.equal(named(native.calls, 'replace').length, 1);
  assert.deepEqual(harness.warnings, []);
});

test('a seek before the source is ready waits for it to open, even past a stale event (AVPlayer rejects early seeks)', async () => {
  const harness = createEngineHarness();
  await harness.engine.load(track('a'));
  await harness.engine.play();
  const native = harness.players[0];
  const seen = watch(harness.engine);
  const before = native.calls.length;

  await harness.engine.seekTo(60);
  // Held back, and playback with it, while the target is already on screen.
  assert.deepEqual(native.calls.slice(before), [['pause']]);
  assert.deepEqual(seen.progress.at(-1), { position: 60, duration: 180 });

  // iOS: an event about the previous item arrives after the swap. The live item
  // is still opening, so the seek must keep waiting.
  const ready = { playing: false, isLoaded: true, isBuffering: false, playbackState: 'readyToPlay', currentTime: 0, duration: 180 };
  native.deliver(ready);
  await harness.flush();
  assert.deepEqual(native.calls.slice(before), [['pause']]);

  // The new item reports ready: the seek lands, then playback starts from it.
  native.emit(ready);
  await harness.flush();
  assert.deepEqual(native.calls.slice(before), [['pause'], ['seek', 60], ['play']]);
});

test('a resume offset holds playback until its seek lands, so it never starts from the beginning', async () => {
  const harness = createEngineHarness();
  await harness.engine.load(track('a'), 23);
  await harness.engine.play();
  const native = harness.players[0];
  assert.equal(named(native.calls, 'play').length, 0);

  native.emit({ playing: false, isLoaded: true, isBuffering: false, playbackState: 'ready', currentTime: 0, duration: 180 });
  await harness.flush();
  assert.deepEqual(plain(native.calls.slice(-3)), [
    ['seek', 23],
    ['lockScreen', true,
      { title: 'Soundscape a', artist: 'Passage', artworkUrl: track('a').artwork },
      { showSeekForward: true, showSeekBackward: true }],
    ['play'],
  ]);
});

test('play on a source that failed while paused reloads it at the last position straight away', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);
  native.emit(playingAt(30));
  await harness.engine.pause();

  // The connection drops while paused; nobody is waiting, so nothing happens yet.
  native.emit(idleAt(30));
  await harness.advance(10_000);
  assert.equal(named(native.calls, 'replace').length, 1);

  await harness.engine.play();
  assert.equal(named(native.calls, 'replace').length, 2);
  assert.deepEqual(seen.progress.at(-1), { position: 30, duration: 3600 });
  const reloaded = native.calls.length;
  native.emit(pausedAt(0));
  await harness.flush();
  assert.deepEqual(native.calls.slice(reloaded), [['seek', 30], ['play']]);
});

test('a native seek that rejects is contained and goes through the same reload', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  native.seekError = new Error('seek failed');

  await harness.engine.seekTo(900);
  assert.equal(named(native.calls, 'replace').length, 2);
  assert.match(harness.warnings.join('\n'), /rejected a seek; reloading at 900s/);

  native.seekError = null;
  const reloaded = native.calls.length;
  native.emit(pausedAt(0));
  await harness.flush();
  assert.deepEqual(native.calls.slice(reloaded), [['seek', 900], ['play']]);
});

test('a long healthy stretch restores the retry budget for a later, separate stall', async () => {
  const harness = createEngineHarness();
  const native = await startPlaying(harness);
  const seen = watch(harness.engine);

  // First failure: one reload fixes it.
  native.emit(idleAt(5));
  await harness.advance(2000);
  native.emit(pausedAt(0));
  await harness.flush();
  for (let second = 1; second <= 25; second++) {
    native.emit(playingAt(5 + second));
    await harness.advance(1000);
  }

  // A separate failure later still gets both reloads before anything is
  // reported; without the refill the second stall here would give up instead.
  native.emit(idleAt(30));
  await harness.advance(2000);
  native.emit(idleAt(0));
  await harness.advance(2000);
  assert.deepEqual(named(native.calls, 'replace').map(([, source]) => source),
    [hour.url, hour.url, hour.url, hour.url]);
  assert.equal(seen.failures, 0);
});

// ----------------------------------------------------------- preview tracks

function loadTypes() {
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/player/types.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(compiled, { module, exports: module.exports });
  return module.exports;
}

test('the onboarding preview plays preview_url, falls back to file_url, and the app player keeps the full file', () => {
  const { toPreviewTrack, toPlayableTrack, setLocalSourceResolver } = loadTypes();
  const row = {
    id: 's1', title: 'Rain', artwork_url: ' https://example.test/s1.jpg ',
    file_url: 'https://example.test/s1.mp3', preview_url: ' https://example.test/s1-clip.mp3 ',
    duration_seconds: 3600,
  };
  const full = {
    id: 's1', url: 'https://example.test/s1.mp3', title: 'Rain', artist: 'Passage',
    artwork: 'https://example.test/s1.jpg', duration: 3600,
  };

  // The clip plays, and the full soundscape's hour is not claimed as its length.
  const clip = { ...full, url: 'https://example.test/s1-clip.mp3' };
  delete clip.duration;
  assert.deepEqual(plain(toPreviewTrack(row)), clip);

  // No clip yet: the full file, which the row's length does describe.
  for (const previewUrl of [null, undefined, '', '   ']) {
    assert.deepEqual(plain(toPreviewTrack({ ...row, preview_url: previewUrl })), full);
  }
  assert.equal(toPreviewTrack({ ...row, preview_url: null, file_url: '  ' }), null);

  // The app-wide player is untouched: the full file, or the download when there is one.
  assert.deepEqual(plain(toPlayableTrack(row)), full);
  setLocalSourceResolver(() => ({ url: 'file:///saved/s1.mp3' }));
  assert.equal(toPlayableTrack(row).url, 'file:///saved/s1.mp3');
  assert.equal(toPreviewTrack(row).url, 'https://example.test/s1-clip.mp3');
  setLocalSourceResolver(null);
});

// ── Lock screen artwork ──────────────────────────────────────────────────────

const lockScreenMetadata = (player, name) => plain(player.calls.filter(([call]) => call === name));

test('a cover already saved on the device is what the lock screen is given', async () => {
  const cache = {
    cached: (url) => 'file:///cache/' + url.split('/').pop(),
    fetch: async () => { throw new Error('nothing to fetch'); },
  };
  const { engine, players } = createEngineHarness({ artworkCache: cache });
  await engine.load(track('a'));
  await engine.play();
  assert.deepEqual(lockScreenMetadata(players[0], 'lockScreen'), [[
    'lockScreen', true,
    { title: 'Soundscape a', artist: 'Passage', artworkUrl: 'file:///cache/a.jpg' },
    { showSeekForward: true, showSeekBackward: true },
  ]]);
});

test('a cover that is not saved yet shows from its URL, then swaps to the saved copy', async () => {
  let finish;
  const cache = {
    cached: () => null,
    fetch: () => new Promise((resolve) => { finish = resolve; }),
  };
  const { engine, players, flush } = createEngineHarness({ artworkCache: cache });
  await engine.load(track('a'));
  await engine.play();
  assert.equal(lockScreenMetadata(players[0], 'lockScreen')[0][2].artworkUrl, track('a').artwork);
  assert.deepEqual(lockScreenMetadata(players[0], 'lockScreenUpdate'), []);

  finish('file:///cache/a.jpg');
  await flush();
  assert.deepEqual(lockScreenMetadata(players[0], 'lockScreenUpdate'), [[
    'lockScreenUpdate',
    { title: 'Soundscape a', artist: 'Passage', artworkUrl: 'file:///cache/a.jpg' },
  ]]);
});

test('a saved cover that arrives after the track changed is not shown for the new track', async () => {
  const pending = new Map();
  const cache = {
    cached: () => null,
    fetch: (url) => new Promise((resolve) => pending.set(url, resolve)),
  };
  const { engine, players, flush } = createEngineHarness({ artworkCache: cache });
  await engine.load(track('a'));
  await engine.play();
  await engine.load(track('b'));

  const afterTrackChange = lockScreenMetadata(players[0], 'lockScreenUpdate');
  pending.get(track('a').artwork)('file:///cache/a.jpg');
  await flush();
  assert.deepEqual(lockScreenMetadata(players[0], 'lockScreenUpdate'), afterTrackChange);

  pending.get(track('b').artwork)('file:///cache/b.jpg');
  await flush();
  assert.equal(lockScreenMetadata(players[0], 'lockScreenUpdate').at(-1)[1].artworkUrl, 'file:///cache/b.jpg');
});

test('a cover that could not be saved leaves the remote URL in place and raises no warning', async () => {
  const cache = { cached: () => null, fetch: async () => null };
  const { engine, players, flush, warnings } = createEngineHarness({ artworkCache: cache });
  await engine.load(track('a'));
  await engine.play();
  await flush();
  assert.deepEqual(lockScreenMetadata(players[0], 'lockScreenUpdate'), []);
  assert.deepEqual(warnings, []);
});

test('a cover already on disk (downloads) is passed through untouched and never re-fetched', async () => {
  const cache = { cached: () => 'unused', fetch: async () => { throw new Error('unexpected fetch'); } };
  const { engine, players, flush } = createEngineHarness({ artworkCache: cache });
  await engine.load({ ...track('a'), artwork: 'file:///docs/a.jpg' });
  await engine.play();
  await flush();
  assert.equal(lockScreenMetadata(players[0], 'lockScreen')[0][2].artworkUrl, 'file:///docs/a.jpg');
});
