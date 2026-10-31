/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

// Loads the real `createPlaybackHealthMonitor` in a VM sandbox with a fake
// clock and a controllable `expo-network` stub — no React/engine needed,
// since the monitor is a plain, framework-agnostic state machine.
function createHealthHarness() {
  const networkListeners = new Set();
  let networkState = { isConnected: true, isInternetReachable: true };
  const scheduled = new Map();
  let nextTimeout = 1;
  let now = 1_000_000;
  const cache = new Map();

  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
      module,
      exports: module.exports,
      console,
      Date: class extends Date { static now() { return now; } },
      setTimeout(callback, delay) {
        const id = nextTimeout++;
        scheduled.set(id, { callback, delay, at: now + delay });
        return id;
      },
      clearTimeout: (id) => scheduled.delete(id),
      require(id) {
        if (id === 'expo-network') {
          return {
            addNetworkStateListener(listener) {
              networkListeners.add(listener);
              return { remove: () => networkListeners.delete(listener) };
            },
            getNetworkStateAsync: async () => networkState,
          };
        }
        const target = id.startsWith('@/')
          ? path.join(root, id.slice(2))
          : path.resolve(path.dirname(file), id);
        return load(target + '.ts');
      },
    }, { filename: file });
    cache.set(file, module.exports);
    return module.exports;
  }

  const mod = load(path.join(root, 'lib/player/playbackHealth.ts'));
  const flush = () => new Promise(setImmediate);

  return {
    createPlaybackHealthMonitor: mod.createPlaybackHealthMonitor,
    setNetworkState(nextState) {
      networkState = { ...networkState, ...nextState };
      for (const listener of [...networkListeners]) listener(networkState);
    },
    flush,
    /** Moves the clock on, firing each due timeout along the way. */
    async advance(milliseconds) {
      const until = now + milliseconds;
      for (;;) {
        await flush();
        const due = [...scheduled]
          .filter(([, timer]) => timer.at <= until)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        const [id, timer] = due;
        scheduled.delete(id);
        now = timer.at;
        timer.callback();
      }
      now = until;
      await flush();
    },
  };
}

test('buffering during startup never counts toward the window, no matter how long', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();

  monitor.reset();
  // Startup never confirmed: even a very long "episode" must be ignored.
  monitor.reportBufferingEpisode(20_000);
  monitor.reportBufferingEpisode(20_000);
  monitor.reportBufferingEpisode(20_000);
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('a single brief buffering episode after startup is not a pattern', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();

  monitor.reset();
  monitor.confirmPlaybackStarted();
  monitor.reportBufferingEpisode(3000);
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('repeated buffering needs both enough episodes and enough total time', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();

  // Enough episodes, not enough total duration.
  monitor.reportBufferingEpisode(1000);
  monitor.reportBufferingEpisode(1000);
  monitor.reportBufferingEpisode(1000);
  assert.equal(monitor.getVerdict(), 'none');

  // Now enough total duration too.
  monitor.reportBufferingEpisode(15_000);
  assert.equal(monitor.getVerdict(), 'interruptions');

  monitor.destroy();
});

test('repeated buffering with only two episodes, however long, is not a pattern', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();

  monitor.reportBufferingEpisode(20_000);
  monitor.reportBufferingEpisode(20_000);
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('two engine-confirmed recovery episodes after startup are a pattern', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();

  monitor.reportRecoveryEpisode(true);
  monitor.reportRecoveryEpisode(false);
  assert.equal(monitor.getVerdict(), 'none');

  monitor.reportRecoveryEpisode(true);
  assert.equal(monitor.getVerdict(), 'interruptions');

  monitor.destroy();
});

test('recovery during startup does not count and does not arm the sustained timer', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();

  monitor.reportRecoveryEpisode(true);
  await h.advance(60_000); // well past SUSTAINED_RECOVERY_MS
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('a single sustained recovery episode escalates on its own and notifies', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();

  let notified = 0;
  const unsubscribe = monitor.subscribe(() => notified++);

  monitor.reportRecoveryEpisode(true);
  assert.equal(monitor.getVerdict(), 'none');

  await h.advance(24_000);
  assert.equal(monitor.getVerdict(), 'none', 'not sustained yet');
  assert.equal(notified, 0);

  await h.advance(2000);
  assert.equal(notified, 1, 'the sustained timer should have pinged once');
  assert.equal(monitor.getVerdict(), 'interruptions');

  unsubscribe();
  monitor.destroy();
});

test('recovery ending before the sustained threshold cancels the timer', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();

  let notified = 0;
  monitor.subscribe(() => notified++);

  monitor.reportRecoveryEpisode(true);
  await h.advance(5000);
  monitor.reportRecoveryEpisode(false);
  await h.advance(60_000);

  assert.equal(notified, 0);
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('reset clears prior evidence for a new track/session', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();
  monitor.reportRecoveryEpisode(true);
  monitor.reportRecoveryEpisode(false);
  monitor.reportRecoveryEpisode(true);
  assert.equal(monitor.getVerdict(), 'interruptions');

  monitor.reset();
  assert.equal(monitor.getVerdict(), 'none', 'old evidence must not leak into the next track');
  // Startup phase is re-armed: buffering now is startup again, still ignored.
  monitor.reportBufferingEpisode(30_000);
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('old episodes age out of the rolling window', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.reset();
  monitor.confirmPlaybackStarted();

  monitor.reportBufferingEpisode(10_000);
  monitor.reportBufferingEpisode(10_000);
  monitor.reportBufferingEpisode(10_000);
  assert.equal(monitor.getVerdict(), 'interruptions');

  await h.advance(130_000); // past the 2-minute rolling window
  assert.equal(monitor.getVerdict(), 'none');

  monitor.destroy();
});

test('isOffline reflects the actual connectivity stub, not a speed guess', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  assert.equal(monitor.isOffline(), false);

  h.setNetworkState({ isConnected: false, isInternetReachable: false });
  await h.flush();
  assert.equal(monitor.isOffline(), true);

  h.setNetworkState({ isConnected: true, isInternetReachable: true });
  await h.flush();
  assert.equal(monitor.isOffline(), false);

  monitor.destroy();
});

test('destroy stops listening for further network changes', async () => {
  const h = createHealthHarness();
  const monitor = h.createPlaybackHealthMonitor();
  await h.flush();
  monitor.destroy();

  h.setNetworkState({ isConnected: false, isInternetReachable: false });
  await h.flush();
  assert.equal(monitor.isOffline(), false, 'a destroyed monitor keeps its last known state');
});
