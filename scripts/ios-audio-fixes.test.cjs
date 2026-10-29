/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const test = require('node:test');
const { patchSource, originals, applyIosAudioFixes } = require('../plugins/with-expo-audio-ios-fixes');
const { playerEdits, moduleEdits, applyEdits } = require('../plugins/ios-audio/patches.cjs');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');

for (const [name, edits] of [['AudioPlayer.swift', playerEdits], ['AudioModule.swift', moduleEdits]]) {
  test(`${name}: exact original source round-trip, repeat installs, and drift rejection`, () => {
    const installed = read(`node_modules/expo-audio/ios/${name}`);
    const patched = patchSource(name, installed);
    const original = applyEdits(patched, [...edits].reverse().map(([before, after, count]) => [after, before, count]));
    assert.equal(crypto.createHash('sha256').update(original).digest('hex'), originals[name]);
    assert.equal(patchSource(name, original), patched);
    assert.equal(patchSource(name, patched), patched);
    assert.equal(patchSource(name, original.replace(/\n/g, '\r\n')), patched);
    assert.throws(() => patchSource(name, patched + '\n// unexpected edit'), /Unrecognised/);
    assert.throws(() => patchSource(name, original.replace('public class', 'class')), /changed|Unrecognised/);
  });
}

test('artwork replacement is installed exactly and rejects unknown native changes', () => {
  const replacement = read('plugins/ios-audio/MediaController.swift');
  assert.equal(patchSource('MediaController.swift', replacement), replacement);
  assert.throws(() => patchSource('MediaController.swift', replacement + '\n// drift'), /Unrecognised/);
  applyIosAudioFixes(root);
  assert.equal(read('node_modules/expo-audio/ios/MediaController.swift'), replacement);
});

test('install and iOS prebuild both apply the patch before native compilation', () => {
  const config = JSON.parse(read('app.json'));
  const manifest = JSON.parse(read('package.json'));
  assert.ok(config.expo.plugins.includes('./plugins/with-expo-audio-ios-fixes'));
  assert.equal(manifest.scripts.postinstall, 'node plugins/with-expo-audio-ios-fixes.js');
});

// These source-contract checks complement JS behavior tests; they are not a
// substitute for compiling Swift and testing thread scheduling on an iPhone.
test('native session activation contract and metadata entry points stay repaired', () => {
  const module = read('node_modules/expo-audio/ios/AudioModule.swift');
  const player = read('node_modules/expo-audio/ios/AudioPlayer.swift');
  assert.match(module, /if !player\.keepAudioSessionActive \{ try activateSession\(\) \}/);
  assert.equal((module.match(/runOnQueue\(audioSessionQueue\)/g) ?? []).length, 2);
  assert.doesNotMatch(module, /audioSessionQueue\.sync|DispatchQueue\.main\.asyncAfter/);
  assert.match(module, /Function\("updateLockScreenMetadata"\)[\s\S]*?DispatchQueue\.main\.async/);
  assert.match(player, /passageReleased = true/);
  assert.doesNotMatch(player, /if isActiveForLockScreen/);
});
