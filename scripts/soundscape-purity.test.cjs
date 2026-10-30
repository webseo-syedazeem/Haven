const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8');

test('the client-approved onboarding route names are preserved', () => {
  for (const route of [
    'app/select-focus.tsx',
    'app/stress-intro-1.tsx',
    'app/stress-intro-2.tsx',
    'app/backed-by-science.tsx',
    'app/onboarding/relax-science.tsx',
  ]) {
    assert.equal(fs.existsSync(path.join(root, route)), true, `${route} should exist`);
  }

  for (const replacedRoute of [
    'app/select-mood.tsx',
    'app/relax-intro-1.tsx',
    'app/relax-intro-2.tsx',
    'app/sound-design.tsx',
    'app/onboarding/relax-sound-design.tsx',
  ]) {
    assert.equal(fs.existsSync(path.join(root, replacedRoute)), false, `${replacedRoute} should be absent`);
  }
});

test('client-approved onboarding screen copy is preserved', () => {
  const introOne = read('app/stress-intro-1.tsx');
  assert.match(introOne, /REDUCE STRESS/);
  assert.match(introOne, /Quieter/);
  assert.match(introOne, /Brighter days/);

  const introTwo = read('app/stress-intro-2.tsx');
  assert.match(introTwo, /Reduce stress and anxiety/);
  assert.match(introTwo, /calm your nervous system/);

  const relaxScience = read('app/onboarding/relax-science.tsx');
  assert.match(relaxScience, /Backed by/);
  assert.match(relaxScience, /Binaural rhythms support relaxation/);
  assert.match(relaxScience, /parasympathetic nervous system/);

  const modes = read('constants/modes.ts');
  assert.match(modes, /Deep work and productivity/);
  assert.match(modes, /Fall asleep and stay asleep/);
  assert.match(modes, /Slow your breathing/);
});

test('client-approved onboarding identifiers and mappings are preserved', () => {
  const selectMode = read('app/select-focus.tsx');
  assert.match(selectMode, /type FocusOption/);
  assert.match(selectMode, /function SelectFocusScreen/);

  assert.match(read('app/stress-intro-1.tsx'), /function StressIntroOneScreen/);
  assert.match(read('app/stress-intro-2.tsx'), /function StressIntroTwoScreen/);

  const relaxScience = read('app/onboarding/relax-science.tsx');
  assert.match(relaxScience, /const FINDINGS/);
  assert.match(relaxScience, /function ScienceIcon/);
  assert.match(relaxScience, /function RelaxScienceScreen/);

  const focusSleepScience = read('app/backed-by-science.tsx');
  assert.match(focusSleepScience, /focusScienceBackground/);
  assert.match(focusSleepScience, /function BackedByScienceScreen/);

  assert.match(read('app/what-it-does.tsx'), /id: 'calm'/);
});

test('client-approved onboarding questions and exact answer values are preserved', () => {
  const situation = read('app/onboarding/situation.tsx');
  assert.match(situation, /What breaks\\nyour focus\?/);
  assert.match(situation, /What gets in the\\nway of sleep\?/);
  for (const value of ['Racing thoughts', 'Phone distractions', 'Low energy', 'Getting started', 'Restlessness', 'An inconsistent routine', 'Waking in the night']) {
    assert.match(situation, new RegExp(value));
  }

  const relaxGoal = read('app/onboarding/relax-main-goal.tsx');
  for (const value of ['Feel less anxious', 'Manage daily stress', 'Be more present', 'Sleep more easily']) {
    assert.match(relaxGoal, new RegExp(value));
  }

  const relaxCauses = read('app/onboarding/relax-causes.tsx');
  for (const value of ['Work', 'Overthinking', 'Social situations', 'News and social media', 'Finances', 'Other']) {
    assert.match(relaxCauses, new RegExp(value));
  }
});

test('Passage legal copy contains no legacy commercial product language', () => {
  const legal = read('constants/legal.ts');
  assert.doesNotMatch(
    legal,
    /subscription|premium tier|free trial|in-app purchase|paywall|RevenueCat/i,
  );
  assert.match(legal, /soundscape app for sleep, relaxation and focus/i);
});
