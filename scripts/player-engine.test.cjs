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

function createEngineHarness() {
  const players = [];
  const audioModes = [];
  const audioActive = [];
  const scheduled = new Map();
  let nextTimeout = 1;
  const audio = {
    setAudioModeAsync: async (mode) => audioModes.push(mode),
    setIsAudioActiveAsync: async (active) => audioActive.push(active),
    createAudioPlayer(source, options) {
      const listeners = new Map();
      const calls = [];
      const player = {
        source, options, calls, currentTime: 0, duration: 180, volume: 1,
        addListener(event, callback) {
          listeners.set(event, callback);
          return { remove() {
            calls.push(['removeListener', event]);
            listeners.delete(event);
          } };
        },
        emit(status) {
          if (typeof status.currentTime === 'number') player.currentTime = status.currentTime;
          if (typeof status.duration === 'number') player.duration = status.duration;
          listeners.get('playbackStatusUpdate')?.(status);
        },
        pause: () => calls.push(['pause']),
        play: () => calls.push(['play']),
        replace(nextSource) {
          player.source = nextSource;
          calls.push(['replace', nextSource]);
        },
        setActiveForLockScreen: (...args) => calls.push(['lockScreen', ...args]),
        clearLockScreenControls: () => calls.push(['clearLockScreen']),
        remove: () => calls.push(['remove']),
        async seekTo(seconds) {
          player.currentTime = seconds;
          calls.push(['seek', seconds]);
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
    module, exports: module.exports, console,
    require(id) {
      if (id === 'expo-audio') return audio;
      if (id === '@/assets/audio/end-tone.wav') return 'end-tone.wav';
      throw new Error('Unexpected engine dependency: ' + id);
    },
    setTimeout(callback, delay) {
      const id = nextTimeout++;
      scheduled.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => scheduled.delete(id),
  });
  return {
    engine: module.exports.engine, players, audioModes, audioActive, scheduled,
    runTimeouts(delay) {
      for (const [id, timeout] of [...scheduled]) {
        if (timeout.delay !== delay) continue;
        scheduled.delete(id);
        timeout.callback();
      }
    },
  };
}

test('queue loads replace audio, lock-screen metadata and progress on the same native player', async () => {
  const { engine, players } = createEngineHarness();
  const progress = [];
  engine.subscribe({ onProgress: (value) => progress.push(plain(value)) });
  // Initial selection, Next, then Previous use the same engine load path.
  for (const item of [track('a'), track('b'), track('a')]) {
    await engine.load(item);
    await engine.play();
    assert.equal(players.length, 1);
    const native = players[0];
    assert.equal(native.source, item.url);
    const metadata = native.calls.filter(([name]) => name === 'lockScreen').at(-1);
    assert.deepEqual(plain(metadata), [
      'lockScreen', true,
      { title: item.title, artist: item.artist, artworkUrl: item.artwork },
      { showSeekForward: true, showSeekBackward: true },
    ]);
    assert.deepEqual(progress.at(-1), { position: 0, duration: 180 });
    assert.deepEqual(native.calls.at(-1), ['play']);
  }
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
  assert.equal(players[0].source, null);
  assert.deepEqual(players[0].calls.slice(-6), [
    ['removeListener', 'playbackStatusUpdate'], ['pause'], ['clearLockScreen'],
    ['lockScreen', false], ['replace', null], ['remove'],
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

test('native config retains background audio and Android swipe-close service teardown', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
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
