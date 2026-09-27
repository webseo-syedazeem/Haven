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
