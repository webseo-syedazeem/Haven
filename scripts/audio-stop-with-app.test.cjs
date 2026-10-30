/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const SERVICE = 'expo.modules.audio.service.AudioControlsService';

/** Runs the plugin's manifest mod against a hand-built manifest. */
function applyPlugin(manifest) {
  const originalLoad = Module._load;
  Module._load = function load(request, ...rest) {
    if (request === 'expo/config-plugins') {
      return {
        AndroidConfig: { Manifest: { getMainApplicationOrThrow: (value) => value.manifest.application[0] } },
        withAndroidManifest: (config, mod) => mod({ ...config, modResults: manifest }),
        withDangerousMod: (config) => config,
      };
    }
    return originalLoad.call(this, request, ...rest);
  };

  try {
    const pluginPath = path.join(root, 'plugins/with-expo-audio-stop-with-app.js');
    delete require.cache[pluginPath];
    return require(pluginPath)({}).modResults;
  } finally {
    Module._load = originalLoad;
  }
}

const services = (manifest) =>
  manifest.manifest.application[0].service.filter((entry) => entry.$['android:name'] === SERVICE);

// Swiping the app away is invisible to JavaScript: nothing in the app can stop the
// media notification then, so this manifest attribute is the whole mechanism.
test('the plugin makes Android stop the audio service when the app task is removed', () => {
  const manifest = applyPlugin({ manifest: { application: [{ $: {} }] } });
  assert.equal(services(manifest).length, 1);
  assert.equal(services(manifest)[0].$['android:stopWithTask'], 'true');
});

test('the plugin updates an existing service entry once, without duplicating it', () => {
  const manifest = applyPlugin({
    manifest: {
      application: [{ $: {}, service: [{ $: { 'android:name': SERVICE, 'android:exported': 'false' } }] }],
    },
  });
  assert.equal(services(manifest).length, 1);
  assert.equal(services(manifest)[0].$['android:stopWithTask'], 'true');
  assert.equal(services(manifest)[0].$['android:exported'], 'false');
});

test('the plugin is registered in the Expo config, so a rebuild applies it', () => {
  const { expo } = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8').replace(/^\uFEFF/, ''));
  assert.ok(expo.plugins.includes('./plugins/with-expo-audio-stop-with-app'));
});

test('native service teardown pauses audio and clears the Android media card before destruction', () => {
  const pluginPath = path.join(root, 'plugins/with-expo-audio-stop-with-app.js');
  delete require.cache[pluginPath];
  const { patchAudioControlsServiceSource } = require(pluginPath);
  const source = [
    'class AudioControlsService {',
    '  override fun onDestroy() {',
    '    super.onDestroy()',
    '    instance = null',
    '  }',
    '}',
  ].join('\n');

  const patched = patchAudioControlsServiceSource(source);
  const pause = patched.indexOf('currentPlayer?.ref?.pause()');
  const hide = patched.indexOf('hideNotification()');
  const clear = patched.indexOf('clearSessionInternal()');
  const destroy = patched.indexOf('super.onDestroy()');
  assert.ok(pause > 0 && pause < hide && hide < clear && clear < destroy);
  assert.equal(patchAudioControlsServiceSource(patched), patched, 'patch must be idempotent');
});

test('the ExoPlayer builder patch adds becoming-noisy + wake mode before build()', () => {
  const pluginPath = path.join(root, 'plugins/with-expo-audio-stop-with-app.js');
  delete require.cache[pluginPath];
  const { patchAudioPlayerSource } = require(pluginPath);
  const source = [
    '  ExoPlayer.Builder(context)',
    '    .setLooper(context.mainLooper)',
    '    .setAudioAttributes(AudioAttributes.DEFAULT, false)',
    '    .setSeekForwardIncrementMs(SEEK_JUMP_INTERVAL_MS)',
    '    .setSeekBackIncrementMs(SEEK_JUMP_INTERVAL_MS)',
    '    .build(),',
  ].join('\n');

  const patched = patchAudioPlayerSource(source);
  const noisy = patched.indexOf('.setHandleAudioBecomingNoisy(true)');
  const wake = patched.indexOf('.setWakeMode(C.WAKE_MODE_NETWORK)');
  const build = patched.indexOf('.build(),');
  assert.ok(noisy > 0 && wake > noisy && build > wake, 'both calls must precede build()');
  assert.equal(patchAudioPlayerSource(patched), patched, 'patch must be idempotent');
});

// Guards against expo-audio changing its ExoPlayer.Builder: the patch regex
// must still match the real vendored source, or the build would silently ship
// without the headphone-disconnect fix.
test('the ExoPlayer builder patch still matches the vendored expo-audio source', () => {
  const vendored = path.join(
    root,
    'node_modules/expo-audio/android/src/main/java/expo/modules/audio/AudioPlayer.kt'
  );
  if (!fs.existsSync(vendored)) return; // node_modules not installed in this environment
  const pluginPath = path.join(root, 'plugins/with-expo-audio-stop-with-app.js');
  delete require.cache[pluginPath];
  const { patchAudioPlayerSource } = require(pluginPath);
  const source = fs.readFileSync(vendored, 'utf8');
  const patched = patchAudioPlayerSource(source);
  assert.ok(patched.includes('.setHandleAudioBecomingNoisy(true)'));
  assert.ok(patched.includes('.setWakeMode(C.WAKE_MODE_NETWORK)'));
});
