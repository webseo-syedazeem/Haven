/**
 * Static-analysis tests for the buildAudioSource helper and its callers.
 *
 * These tests read the source files and assert the structural properties that
 * make audio-auth delivery correct:
 *
 *  1. /soundscapes/ path (any host, including CDN) → Authorization header attached,
 *     URL rewritten to API_BASE_URL host so the token never reaches a foreign host
 *  2. /previews/ → NO header (public route, no token)
 *  3. CDN URLs are rewritten to API_BASE_URL before the token is attached
 *  4. Token resolved fresh on every call (live resolveRequestToken, never cached)
 */

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('buildAudioSource attaches Authorization header for /soundscapes/ path URLs', () => {
  const src = read('lib/player/audioSource.ts');
  assert.match(src, /isSoundscapePath/);
  assert.match(src, /\/soundscapes\//);
  assert.match(src, /Authorization.*Bearer.*token/);
});

test('buildAudioSource returns plain track.url for non-soundscape URLs (previews, foreign hosts)', () => {
  const src = read('lib/player/audioSource.ts');
  // Early return for non-soundscape tracks — no token, no headers object.
  assert.match(src, /isSoundscapePath/);
  assert.match(src, /return track\.url/);
  // The Authorization header is only inside the guarded branch (after the token is resolved).
  // Verify the token resolution comes after the isSoundscapePath check in source order.
  const guardIdx = src.indexOf("isSoundscapePath");
  const tokenResolveIdx = src.indexOf("await resolveRequestToken");
  assert.ok(tokenResolveIdx > guardIdx, 'token resolution must appear after the isSoundscapePath guard');
});

test('buildAudioSource rewrites CDN URLs to API_BASE_URL so the token is never sent to a foreign host', () => {
  const src = read('lib/player/audioSource.ts');
  // toApiUri must always use API_BASE_URL as the host, regardless of input host.
  assert.match(src, /toApiUri/);
  assert.match(src, /API_BASE_URL.*pathname|pathname.*API_BASE_URL/);
  // The token-attach path must call toApiUri, not a plain absolute-URL helper.
  assert.match(src, /uri:\s*toApiUri/);
});

test('buildAudioSource resolves token live via resolveRequestToken, not from a cache', () => {
  const src = read('lib/player/audioSource.ts');
  assert.match(src, /resolveRequestToken/);
  // Must never store the token in a module-level variable.
  assert.doesNotMatch(src, /let token\s*=/);
  assert.doesNotMatch(src, /const token\s*=\s*[^(]/);
});

test('buildAudioSource is called at both replace() sites in engine.ts', () => {
  const engine = read('lib/player/engine.ts');
  const matches = [...engine.matchAll(/buildAudioSource/g)];
  // import + two call sites = at least 3 occurrences.
  assert.ok(matches.length >= 3, `expected ≥3 occurrences of buildAudioSource, got ${matches.length}`);
});

test('engine.ts no longer passes track.url directly to replace()', () => {
  const engine = read('lib/player/engine.ts');
  // Any remaining replace(track.url) would bypass the auth header.
  assert.doesNotMatch(engine, /current\.replace\(track\.url\)/);
});

test('token is never stored in PlayableTrack or logged', () => {
  const types = read('lib/player/types.ts');
  // PlayableTrack must have no token/auth field.
  assert.doesNotMatch(types, /token|authorization/i);

  const engine = read('lib/player/engine.ts');
  // Token must never appear in log output.
  assert.doesNotMatch(engine, /console\.(log|warn|error).*token/i);
});

test('resolveRequestToken is exported from client.ts', () => {
  const client = read('lib/api/client.ts');
  assert.match(client, /export\s+async\s+function\s+resolveRequestToken/);
});
