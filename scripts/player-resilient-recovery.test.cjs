const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('stream recovery has no fixed retry ceiling and resumes on reconnect', () => {
  const engine = fs.readFileSync(path.join(root, 'lib/player/engine.ts'), 'utf8');

  assert.doesNotMatch(engine, /MAX_RECOVERY_ATTEMPTS/);
  assert.match(engine, /RECOVERY_BACKOFF_MS[\s\S]*60_000/);
  assert.match(engine, /wasUnavailable === true[\s\S]*handleStall\('connection was restored'\)/);
  assert.match(engine, /networkUnavailable === true\) return/);
});

test('player exposes non-terminal connection hints driven by playback evidence, not network type', () => {
  const provider = fs.readFileSync(path.join(root, 'lib/player/PlayerProvider.tsx'), 'utf8');
  const monitor = fs.readFileSync(path.join(root, 'lib/player/playbackHealth.ts'), 'utf8');

  // Non-terminal hints exist, distinct from the engine's own "Reconnecting…"
  // recovery state, and are driven by the adaptive health monitor
  // (lib/player/playbackHealth.ts) rather than a single fixed buffering
  // timeout.
  assert.match(provider, /INTERRUPTIONS_MESSAGE = 'Playback is experiencing interruptions\.'/);
  assert.match(provider, /OFFLINE_MESSAGE = 'Unable to connect\. Please check your connection\.'/);
  assert.match(provider, /RECOVERING_MESSAGE = 'Reconnecting\.\.\.'/);
  assert.doesNotMatch(provider, /reconnecting automatically/);
  assert.match(provider, /onRecoveryStateChange/);
  assert.match(provider, /canRetry: false/);
  // Audit M-NET-1: the hint is driven by actual playback evidence (buffering
  // episodes, recovery episodes, real connectivity), never guessed from the
  // network connection type.
  assert.doesNotMatch(provider, /NetworkStateType/);
  assert.doesNotMatch(monitor, /NetworkStateType/);
  assert.match(monitor, /isOffline/);
});
