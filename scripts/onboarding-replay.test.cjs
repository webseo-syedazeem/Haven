/* global __dirname */
/**
 * lib/onboarding-replay.ts backs the TestFlight-only "Replay onboarding"
 * button (config/dev-flags.ts: SHOW_DEV_ONBOARDING_REPLAY_BUTTON). These run
 * the real module in a sandbox with a fake on-device store, so an "app killed
 * mid-replay" relaunch can be modeled honestly: a fresh module load gets a
 * fresh `replayActive = false` (it really is just an in-memory variable), but
 * the fake store persists across loads exactly like real on-device storage
 * would survive a process restart.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

const DEFAULT_ANSWERS = {
  mode: null,
  mode_breakers: [],
  mode_areas: [],
  target_minutes: null,
  main_goal: null,
  relax_causes: [],
  calming_moments: null,
  goals: [],
  startingMode: null,
  mainGoal: null,
  relaxCauses: [],
  calmingMoments: null,
  situation: [],
  environments: [],
  preferredSounds: [],
  excludedSounds: [],
  detailPreference: null,
  sessionLength: null,
};

/**
 * Loads a fresh instance of lib/onboarding-replay.ts. `diskStore` is a plain
 * object passed in by the caller and read/written exactly like the real
 * SecureStore-backed `getLocalSetting`/`setLocalSetting` would — callers that
 * want to simulate a relaunch pass the SAME diskStore object into a second
 * `load(...)` call, which yields a brand-new module (so a brand-new
 * `replayActive = false`) still reading the same persisted data.
 */
function load({ diskStore, liveAnswers, restoreCalls, invalidateCalls, requireAllowlist }) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'lib/onboarding-replay.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(id) {
      requireAllowlist?.add(id);
      if (id === '@/lib/onboarding') {
        return {
          getGuestOnboardingAnswers: async () => liveAnswers.current,
          restoreGuestOnboardingAnswers: async (answers) => {
            restoreCalls.push(answers);
            liveAnswers.current = answers;
          },
        };
      }
      if (id === '@/lib/local-settings') {
        return {
          getLocalSetting: async (key, fallback) =>
            Object.prototype.hasOwnProperty.call(diskStore, key) ? diskStore[key] : fallback,
          setLocalSetting: async (key, value) => {
            diskStore[key] = value;
          },
        };
      }
      if (id === '@/lib/query-client') {
        return {
          queryClient: {
            invalidateQueries: async (arg) => {
              invalidateCalls.push(arg);
              return undefined;
            },
          },
        };
      }
      throw new Error(`Unexpected onboarding-replay dependency: ${id}`);
    },
  });
  return module.exports;
}

function harness(initialAnswers = DEFAULT_ANSWERS) {
  return {
    diskStore: {},
    liveAnswers: { current: initialAnswers },
    restoreCalls: [],
    invalidateCalls: [],
    requireAllowlist: new Set(),
  };
}

test('replay start does not touch auth/guest flags: the module imports only onboarding, local-settings and query-client', () => {
  const h = harness();
  // The sandboxed `require` throws on any id outside this exact set, so a
  // successful load across every exported function already proves the module
  // never reaches into lib/auth/session-state or any other auth/guest module.
  const mod = load(h);
  assert.equal(typeof mod.beginOnboardingReplay, 'function');
  assert.equal(typeof mod.endOnboardingReplay, 'function');
  assert.equal(typeof mod.recoverAbandonedOnboardingReplay, 'function');
  assert.equal(typeof mod.isOnboardingReplayActive, 'function');
});

test('isOnboardingReplayActive starts false and flips true only once a replay begins', async () => {
  const h = harness();
  const mod = load(h);

  assert.equal(mod.isOnboardingReplayActive(), false);
  await mod.beginOnboardingReplay();
  assert.equal(mod.isOnboardingReplayActive(), true);
});

test('beginOnboardingReplay snapshots the current local answers to disk', async () => {
  const h = harness({ ...DEFAULT_ANSWERS, mode: 'focus', mode_breakers: ['Phone'] });
  const mod = load(h);

  await mod.beginOnboardingReplay();

  const [[key, snapshot]] = Object.entries(h.diskStore).map((entry) => entry);
  assert.match(key, /replay_snapshot/);
  assert.equal(snapshot.mode, 'focus');
  assert.deepEqual(snapshot.mode_breakers, ['Phone']);
});

test('endOnboardingReplay clears the flag and the on-disk snapshot without restoring anything', async () => {
  const h = harness({ ...DEFAULT_ANSWERS, mode: 'focus' });
  const mod = load(h);

  await mod.beginOnboardingReplay();
  await mod.endOnboardingReplay();

  assert.equal(mod.isOnboardingReplayActive(), false);
  assert.equal(h.restoreCalls.length, 0, 'a successful finish must never restore the old answers');
  for (const value of Object.values(h.diskStore)) {
    assert.equal(value, null);
  }
});

test('endOnboardingReplay invalidates the onboarding/recommendations query family', async () => {
  const h = harness();
  const mod = load(h);

  await mod.beginOnboardingReplay();
  await mod.endOnboardingReplay();

  assert.equal(h.invalidateCalls.length, 1);
  // The array literal is constructed inside the vm sandbox (its own JS
  // realm), so it is a different Array constructor than this file's — plain()
  // strips both sides down to JSON before comparing, same as
  // scripts/timer-presets.test.cjs does for the same reason.
  const plain = (value) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(h.invalidateCalls[0].queryKey), ['onboarding']);
});

test('recoverAbandonedOnboardingReplay is a no-op when no replay was ever started', async () => {
  const h = harness();
  const mod = load(h);

  await mod.recoverAbandonedOnboardingReplay();

  assert.equal(h.restoreCalls.length, 0);
  assert.equal(mod.isOnboardingReplayActive(), false);
});

test('an abandoned replay is restored within the same run (flag still true, never persisted)', async () => {
  const original = { ...DEFAULT_ANSWERS, mode: 'sleep', mode_breakers: ['Racing thoughts'] };
  const h = harness(original);
  const mod = load(h);

  await mod.beginOnboardingReplay();
  // User picks a new mode mid-replay, then backs out before finishing.
  h.liveAnswers.current = { ...DEFAULT_ANSWERS, mode: 'relax', relax_causes: ['Work'] };

  await mod.recoverAbandonedOnboardingReplay();

  assert.equal(h.restoreCalls.length, 1);
  assert.deepEqual(h.restoreCalls[0], original);
  assert.equal(mod.isOnboardingReplayActive(), false);
});

test('a replay abandoned by an app kill is still restored after relaunch, via the on-disk snapshot alone', async () => {
  const original = { ...DEFAULT_ANSWERS, mode: 'focus', mode_areas: ['At a desk'] };
  const h = harness(original);

  // Process #1: the replay starts, then the app is killed before it finishes.
  const beforeKill = load(h);
  await beforeKill.beginOnboardingReplay();
  assert.equal(beforeKill.isOnboardingReplayActive(), true);

  // Process #2 (relaunch): a brand-new module instance, so a brand-new
  // `replayActive = false` — the in-memory flag really is gone. Only the
  // on-disk snapshot, written by process #1, survives into this instance.
  h.liveAnswers.current = { ...DEFAULT_ANSWERS, mode: 'relax' }; // leftover partial edit
  const afterRelaunch = load(h);
  assert.equal(afterRelaunch.isOnboardingReplayActive(), false);

  await afterRelaunch.recoverAbandonedOnboardingReplay();

  assert.equal(h.restoreCalls.length, 1);
  assert.deepEqual(h.restoreCalls[0], original);
  // The snapshot is consumed, so a second relaunch does not re-restore it.
  const afterSecondRelaunch = load(h);
  await afterSecondRelaunch.recoverAbandonedOnboardingReplay();
  assert.equal(h.restoreCalls.length, 1);
});
