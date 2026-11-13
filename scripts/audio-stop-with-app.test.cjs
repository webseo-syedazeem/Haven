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

// Swiping the app away is invisible to JavaScript. The native onTaskRemoved
// override is what stops playback and clears the media card then — and Android
// only delivers that callback when the service is NOT set to stop with the task,
// so the manifest attribute must be 'false' for the whole mechanism to fire.
test('the plugin keeps the audio service alive to the task-removed callback', () => {
  const manifest = applyPlugin({ manifest: { application: [{ $: {} }] } });
  assert.equal(services(manifest).length, 1);
  assert.equal(services(manifest)[0].$['android:stopWithTask'], 'false');
});

test('the plugin updates an existing service entry once, without duplicating it', () => {
  const manifest = applyPlugin({
    manifest: {
      application: [{ $: {}, service: [{ $: { 'android:name': SERVICE, 'android:exported': 'false' } }] }],
    },
  });
  assert.equal(services(manifest).length, 1);
  assert.equal(services(manifest)[0].$['android:stopWithTask'], 'false');
  assert.equal(services(manifest)[0].$['android:exported'], 'false');
});

test('the plugin is registered in the Expo config, so a rebuild applies it', () => {
  const { expo } = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8').replace(/^\uFEFF/, ''));
  assert.ok(expo.plugins.includes('./plugins/with-expo-audio-stop-with-app'));
});

test('native service stops playback + clears the media card on task removal, with an onDestroy fallback', () => {
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

  // onTaskRemoved is the primary hook (fires while the process is alive) and is
  // added just before onDestroy.
  const taskRemoved = patched.indexOf('override fun onTaskRemoved(rootIntent: Intent?)');
  const destroy = patched.indexOf('override fun onDestroy()');
  assert.ok(taskRemoved > 0 && taskRemoved < destroy, 'onTaskRemoved must be added before onDestroy');

  // In onTaskRemoved: pause -> hide -> clear -> stopSelf, all before onDestroy.
  const trPause = patched.indexOf('currentPlayer?.ref?.pause()', taskRemoved);
  const trHide = patched.indexOf('hideNotification()', taskRemoved);
  const trClear = patched.indexOf('clearSessionInternal()', taskRemoved);
  const trStop = patched.indexOf('stopSelf()', taskRemoved);
  assert.ok(
    trPause > taskRemoved && trPause < trHide && trHide < trClear && trClear < trStop && trStop < destroy,
    'onTaskRemoved must pause, hide the notification, clear the session, then stopSelf'
  );

  // onDestroy keeps a fallback teardown after super.onDestroy().
  const superDestroy = patched.indexOf('super.onDestroy()');
  const fbPause = patched.indexOf('currentPlayer?.ref?.pause()', superDestroy);
  const fbHide = patched.indexOf('hideNotification()', superDestroy);
  const fbClear = patched.indexOf('clearSessionInternal()', superDestroy);
  assert.ok(
    superDestroy > destroy && fbPause > superDestroy && fbPause < fbHide && fbHide < fbClear,
    'onDestroy must keep a pause/hide/clear fallback after super.onDestroy()'
  );

  assert.equal(patchAudioControlsServiceSource(patched), patched, 'patch must be idempotent');
});

test('the ExoPlayer builder patch enables audio focus and adds becoming-noisy + wake mode before build()', () => {
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

  // Audio focus: the opt-out `DEFAULT, false` is replaced with media attributes
  // and handleAudioFocus = true, so playback pauses when another app plays.
  assert.ok(!patched.includes('AudioAttributes.DEFAULT, false'), 'the focus opt-out must be removed');
  const usage = patched.indexOf('.setUsage(C.USAGE_MEDIA)');
  const content = patched.indexOf('.setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)');
  // The ExoPlayer.Builder's own build() is the LAST build() in the chain; the
  // AudioAttributes.Builder().build() inside the attributes is an earlier one.
  const build = patched.lastIndexOf('.build(),');
  assert.ok(usage > 0 && content > usage && build > content, 'media audio attributes must precede build()');
  // handleAudioFocus = true is the second arg to setAudioAttributes(...).
  const attrs = patched.indexOf('.setAudioAttributes(');
  assert.ok(/\.setAudioAttributes\([\s\S]*?\.build\(\),\s*\n\s*true\s*\n\s*\)/.test(patched), 'handleAudioFocus must be true');

  // Becoming-noisy + wake mode still land before the final build().
  const noisy = patched.indexOf('.setHandleAudioBecomingNoisy(true)');
  const wake = patched.indexOf('.setWakeMode(C.WAKE_MODE_NETWORK)');
  assert.ok(noisy > attrs && wake > noisy && build > wake, 'both calls must precede build()');

  // Initial-buffer trim: a LoadControl with a lowered start threshold is added
  // before build() so the first sound arrives sooner.
  const loadControl = patched.indexOf('.setLoadControl(');
  assert.ok(loadControl > 0 && loadControl < build, 'a LoadControl must be added before build()');
  assert.ok(
    patched.includes('.setBufferDurationsMs(50_000, 50_000, 1_000, 2_000)'),
    'the start/rebuffer thresholds must be trimmed'
  );

  assert.equal(patchAudioPlayerSource(patched), patched, 'patch must be idempotent');
});

// Guards against expo-audio changing its ExoPlayer.Builder: the patch must still
// match the real vendored source, or the build would silently ship without the
// audio-focus, headphone-disconnect, and wake-mode fixes.
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
  assert.ok(patched.includes('.setUsage(C.USAGE_MEDIA)'));
  assert.ok(patched.includes('.setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)'));
  assert.ok(!patched.includes('AudioAttributes.DEFAULT, false'));
  assert.ok(patched.includes('.setHandleAudioBecomingNoisy(true)'));
  assert.ok(patched.includes('.setWakeMode(C.WAKE_MODE_NETWORK)'));
  assert.ok(patched.includes('.setLoadControl('));
  assert.ok(patched.includes('import androidx.media3.exoplayer.DefaultLoadControl'));
});
