/**
 * Static-analysis tests for the transparent on-device audio cache
 * (lib/audio-file-cache.ts) and its wiring.
 *
 * It is an internal replay cache — NOT the removed user-facing downloads:
 *  - lives under the OS *cache* directory (evictable),
 *  - only fills on Wi-Fi (never spends mobile data),
 *  - only starts after a track has played undisturbed for a quiet window,
 *  - cancels the moment a new soundscape plays (playback priority),
 *  - is bounded by a file count and a byte cap, evicting the oldest,
 *  - is injected at startup, so the engine never imports expo-file-system.
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('audio cache lives under the OS cache dir and only fills on Wi-Fi', () => {
  const src = read('lib/audio-file-cache.ts');
  assert.match(src, /cacheDirectory/);
  assert.match(src, /NetworkStateType\.WIFI/);
  assert.match(src, /await onWifi\(\)/);
});

test('audio cache is bounded, evicts oldest, and yields to playback (artwork priority)', () => {
  const src = read('lib/audio-file-cache.ts');
  assert.match(src, /MAX_FILES/);
  assert.match(src, /MAX_BYTES/);
  assert.match(src, /function prune/);
  // Downloads to a .part file then moves into place (a partial is never served).
  assert.match(src, /\.part/);
  assert.match(src, /moveAsync/);
  // A new play cancels the in-progress cache download so artwork/stream win.
  assert.match(src, /createDownloadResumable/);
  assert.match(src, /cancelActiveDownload/);
  // notePlay is the per-play signal that performs that cancel (cached or streamed).
  assert.match(src, /function notePlay/);
  assert.match(src, /export const audioFileCache\s*:\s*AudioFileCache\s*=\s*\{[^}]*notePlay/);
});

test('audio cache is registered at startup (injected, not imported by the engine)', () => {
  const startup = read('lib/startup-cleanup.ts');
  assert.match(startup, /setAudioFileCache\(audioFileCache\)/);
  // The engine must not import expo-file-system, directly or via audioSource.
  assert.doesNotMatch(read('lib/player/engine.ts'), /expo-file-system/);
  assert.doesNotMatch(read('lib/player/audioSource.ts'), /expo-file-system/);
});
