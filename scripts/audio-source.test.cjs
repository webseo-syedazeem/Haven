/**
 * Static-analysis tests for the buildAudioSource helper and its callers.
 *
 * The delivery model these assert:
 *
 *  1. /soundscapes/ path → a short-lived *signed* URL fetched from
 *     /api/soundscapes/:id/stream and played as a plain string (no header), so
 *     the audio can be served from the CDN edge.
 *  2. There is NO Authorization/Bearer header path anywhere — signing is the
 *     only access route for full audio.
 *  3. /previews/ or any non-soundscape URL → plain track.url, untouched.
 *  4. Nothing sensitive is held at module scope; the only cache stores signed
 *     URLs (+ expiry).
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('buildAudioSource uses a signed stream URL for /soundscapes/ paths', () => {
  const src = read('lib/player/audioSource.ts');
  assert.match(src, /isSoundscapePath/);
  assert.match(src, /\/soundscapes\//);
  assert.match(src, /\/api\/soundscapes\/\$\{encodeURIComponent\(track\.id\)\}\/stream/);
  assert.match(src, /return signedUrl;/);
});

test('buildAudioSource plays a cached local copy before streaming, then warms the cache', () => {
  const src = read('lib/player/audioSource.ts');
  assert.match(src, /getAudioFileCache\(\)/);
  // Every play signals the cache so an in-progress download yields to it.
  assert.match(src, /cache\?\.notePlay\(track\.id\)/);
  assert.match(src, /cache\.cachedUri\(track\.id\)/);
  assert.match(src, /cache\?\.warm\(track\.id, signedUrl\)/);
  // The local-cache lookup must happen before the network stream call.
  const cacheIdx = src.indexOf('cache.cachedUri(track.id)');
  const signIdx = src.indexOf('const signedUrl = await resolveSignedStreamUrl(track)');
  assert.ok(cacheIdx !== -1 && signIdx > cacheIdx, 'cache lookup must precede streaming');
});

test('audioSource does not import expo-file-system directly (cache is injected)', () => {
  const src = read('lib/player/audioSource.ts');
  assert.doesNotMatch(src, /expo-file-system/);
});

test('buildAudioSource has NO auth-header/token path (signed URLs only)', () => {
  const src = read('lib/player/audioSource.ts');
  // No headers object is ever returned, no Authorization header, no Bearer token.
  assert.doesNotMatch(src, /headers\s*:/);
  assert.doesNotMatch(src, /Authorization\s*:/);
  assert.doesNotMatch(src, /`Bearer \$\{/);
  // The old token/host-rewrite helpers are gone entirely.
  assert.doesNotMatch(src, /resolveRequestToken/);
  assert.doesNotMatch(src, /resolveStreamToken/);
  assert.doesNotMatch(src, /toApiUri/);
  assert.doesNotMatch(src, /\bsupabase\b/);
});

test('buildAudioSource returns plain track.url for non-soundscape URLs (previews, foreign hosts)', () => {
  const src = read('lib/player/audioSource.ts');
  assert.match(src, /return track\.url/);
  const guardIdx = src.indexOf('if (!isSoundscapePath(track.url))');
  const signedIdx = src.indexOf('const signedUrl = await resolveSignedStreamUrl(track)');
  assert.ok(guardIdx !== -1, 'the isSoundscapePath guard must exist');
  assert.ok(signedIdx > guardIdx, 'signing work must appear after the guard');
});

test('the only module-level cache holds signed URLs (+ expiry), nothing sensitive', () => {
  const src = read('lib/player/audioSource.ts');
  assert.match(src, /signedUrlCache\s*=\s*new Map/);
  assert.match(src, /signedUrlCache\.set\([^)]*url[^)]*expiresAt/);
  // No module-level mutable token/secret holder of any kind.
  assert.doesNotMatch(src, /^\s*(let|var)\s+(token|secret)\b/m);
});

test('buildAudioSource is called at both replace() sites in engine.ts', () => {
  const engine = read('lib/player/engine.ts');
  const matches = [...engine.matchAll(/buildAudioSource/g)];
  // import + two call sites = at least 3 occurrences.
  assert.ok(matches.length >= 3, `expected ≥3 occurrences of buildAudioSource, got ${matches.length}`);
});

test('engine.ts no longer passes track.url directly to replace()', () => {
  const engine = read('lib/player/engine.ts');
  assert.doesNotMatch(engine, /current\.replace\(track\.url\)/);
});

test('token is never stored in PlayableTrack or logged', () => {
  const types = read('lib/player/types.ts');
  assert.doesNotMatch(types, /token|authorization/i);

  const engine = read('lib/player/engine.ts');
  assert.doesNotMatch(engine, /console\.(log|warn|error).*token/i);
});
