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

test('player exposes a non-terminal slow connection message', () => {
  const provider = fs.readFileSync(path.join(root, 'lib/player/PlayerProvider.tsx'), 'utf8');

  assert.match(provider, /RECOVERING_MESSAGE = 'Slow connection'/);
  assert.doesNotMatch(provider, /reconnecting automatically/);
  assert.match(provider, /onRecoveryStateChange/);
  assert.match(provider, /canRetry: false/);
});
