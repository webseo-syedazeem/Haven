/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const plain = (value) => JSON.parse(JSON.stringify(value));

function loadTimers(devTimerPresetFlag) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'constants/timers.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(id) {
      if (id === '@/config/dev-flags') {
        return { SHOW_DEV_TIMER_PRESETS: devTimerPresetFlag };
      }
      throw new Error(`Unexpected timer dependency: ${id}`);
    },
  });
  return module.exports;
}

const productionPresets = {
  sleep: [
    { value: 30, label: '30 min' },
    { value: 60, label: '1 hr' },
    { value: 120, label: '2 hr' },
    { value: 240, label: '4 hr' },
    { value: 480, label: '8 hr' },
    { value: 'until_i_stop', label: 'Until I Stop' },
  ],
  relax: [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 20, label: '20 min' },
    { value: 30, label: '30 min' },
    { value: 60, label: '60 min' },
    { value: 'until_i_stop', label: 'Until I Stop' },
  ],
  focus: [
    { value: 25, label: '25 min' },
    { value: 50, label: '50 min' },
    { value: 90, label: '90 min' },
    { value: 120, label: '2 hr' },
    { value: 'until_i_stop', label: 'Until I Stop' },
  ],
};

test('flag false preserves every production timer preset exactly', () => {
  const { buildModeTimers, MODE_TIMERS } = loadTimers(false);
  const built = buildModeTimers(false);

  for (const mode of ['sleep', 'relax', 'focus']) {
    assert.deepEqual(plain(built[mode].presets), productionPresets[mode]);
    assert.deepEqual(plain(MODE_TIMERS[mode].presets), productionPresets[mode]);
  }
});

test('flag true adds missing Test presets without duplicating real values', () => {
  const { buildModeTimers, MODE_TIMERS } = loadTimers(true);
  const built = buildModeTimers(true);

  for (const timers of [built, MODE_TIMERS]) {
    assert.deepEqual(plain(timers.sleep.presets.slice(-2)), [
      { value: 5, label: 'Test · 5 min' },
      { value: 10, label: 'Test · 10 min' },
    ]);
    assert.deepEqual(plain(timers.focus.presets.slice(-2)), [
      { value: 5, label: 'Test · 5 min' },
      { value: 10, label: 'Test · 10 min' },
    ]);
    assert.deepEqual(plain(timers.relax.presets), productionPresets.relax);

    for (const mode of ['sleep', 'relax', 'focus']) {
      const values = timers[mode].presets.map((preset) => preset.value);
      assert.equal(new Set(values).size, values.length, `${mode} has duplicate values`);
    }
  }
});

test('Test timer presets are isolated from server default timer preferences', () => {
  const settingsSource = fs.readFileSync(
    path.join(root, 'app/profile/playback-settings.tsx'),
    'utf8'
  );

  assert.doesNotMatch(settingsSource, /Test ·/);
  assert.doesNotMatch(settingsSource, /buildModeTimers|MODE_TIMERS/);
});
