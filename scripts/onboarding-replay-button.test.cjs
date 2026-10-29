/* global __dirname */
/**
 * The "Replay onboarding" dev button has no Jest / React Native Testing
 * Library available (this project runs plain `node --test`), so its
 * flag-gating, route exclusions and wiring into _layout.tsx / index.tsx /
 * try-passage.tsx are checked the same way scripts/single-tap-queues.test.cjs
 * checks other component-level rules: by reading the real source files. The
 * behavioral half (snapshot/restore/invalidate) is covered directly in
 * scripts/onboarding-replay.test.cjs since that logic is plain functions.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('the flag is a hard-coded boolean, not derived from __DEV__ or an env var', () => {
  const source = read('config/dev-flags.ts');
  // Release builds intentionally use false; this test checks a literal, not its rollout value.
  assert.match(source, /export const SHOW_DEV_ONBOARDING_REPLAY_BUTTON = (?:true|false);/);
  assert.doesNotMatch(source, /SHOW_DEV_ONBOARDING_REPLAY_BUTTON\s*=\s*__DEV__/);
  assert.doesNotMatch(source, /SHOW_DEV_ONBOARDING_REPLAY_BUTTON\s*=\s*process\.env/);
});

test('the button never mounts when the flag is false: the flag gates the render, not just a style', () => {
  const source = read('components/dev/DevOnboardingReplayButton.tsx');
  assert.match(source, /SHOW_DEV_ONBOARDING_REPLAY_BUTTON/);
  // `hidden` folds the flag in and the component returns null when hidden —
  // i.e. nothing renders, rather than rendering an invisible button.
  assert.match(source, /!SHOW_DEV_ONBOARDING_REPLAY_BUTTON/);
  assert.match(source, /if \(hidden\) return null;/);
});

test('the button is hidden on every onboarding screen and every login/signup screen', () => {
  const source = read('components/dev/DevOnboardingReplayButton.tsx');
  const required = [
    'onboarding',
    'why-passage',
    'what-it-does',
    'select-focus',
    'stress-intro-1',
    'stress-intro-2',
    'backed-by-science',
    'welcome',
    'create-account',
    'login',
    'verify-email',
    'verified',
  ];
  for (const segment of required) {
    assert.match(
      source,
      new RegExp(`'${segment}'`),
      `expected '${segment}' in the hidden-route list`
    );
  }
});

test('a double press is guarded: the handler bails while a press is already in flight', () => {
  const source = read('components/dev/DevOnboardingReplayButton.tsx');
  assert.match(source, /useSinglePress/);
  assert.match(source, /if \(busy\) return;/);
});

test('pressing the button stops playback and starts the replay before navigating', () => {
  const source = read('components/dev/DevOnboardingReplayButton.tsx');
  const stopIndex = source.indexOf('await stop()');
  const beginIndex = source.indexOf('await beginOnboardingReplay()');
  const navigateIndex = source.indexOf("router.replace('/why-passage')");

  assert.ok(stopIndex > -1 && beginIndex > -1 && navigateIndex > -1);
  assert.ok(stopIndex < beginIndex, 'must stop playback before starting the replay');
  assert.ok(beginIndex < navigateIndex, 'must snapshot/mark the replay before navigating away');
});

test('the button does not sign out or touch guest/session state: it never imports lib/auth/session-state', () => {
  const source = read('components/dev/DevOnboardingReplayButton.tsx');
  assert.doesNotMatch(source, /lib\/auth\/session-state/);
  assert.doesNotMatch(source, /signOut/);
  assert.doesNotMatch(source, /setGuestModeActive/);
});

test('_layout.tsx mounts the replay button alongside the existing dev reset button', () => {
  const source = read('app/_layout.tsx');
  assert.match(source, /<DevResetButton \/>/);
  assert.match(source, /<DevOnboardingReplayButton \/>/);
  const resetIndex = source.indexOf('<DevResetButton />');
  const replayIndex = source.indexOf('<DevOnboardingReplayButton />');
  assert.ok(resetIndex > -1 && replayIndex > -1);
});

test('the launch screen recovers an abandoned replay before any routing decision reads local onboarding progress', () => {
  const source = read('app/index.tsx');
  const effectBodyStart = source.indexOf('void (async () => {');
  const recoverIndex = source.indexOf('await recoverAbandonedOnboardingReplay();');
  const resetBranchIndex = source.indexOf("if (reset === '1')");
  // The first CALL to getOnboardingResumeRoute, not its import higher up.
  const firstResumeRouteCall = source.indexOf('getOnboardingResumeRoute(', effectBodyStart);

  assert.ok(recoverIndex > -1, 'index.tsx must call recoverAbandonedOnboardingReplay');
  assert.ok(effectBodyStart > -1 && recoverIndex > effectBodyStart);
  assert.ok(recoverIndex < resetBranchIndex);
  assert.ok(recoverIndex < firstResumeRouteCall);
});

test('the final onboarding screen ends the replay only on a successful submit, never on the incomplete-answers bounce or a failure', () => {
  const source = read('app/onboarding/try-passage.tsx');
  const finishIndex = source.indexOf('await finishOnboardingForAppEntry();');
  const endReplayIndex = source.indexOf('if (isOnboardingReplayActive()) await endOnboardingReplay();');
  const incompleteReturnIndex = source.indexOf('router.replace(incompleteRoute);');
  const catchIndex = source.indexOf('} catch {');

  assert.ok(finishIndex > -1 && endReplayIndex > -1 && incompleteReturnIndex > -1 && catchIndex > -1);
  // endOnboardingReplay runs only after the real submit succeeded...
  assert.ok(finishIndex < endReplayIndex);
  // ...and strictly before the incomplete-route early return and the catch
  // block, so neither path ends the replay.
  assert.ok(incompleteReturnIndex < finishIndex);
  assert.ok(endReplayIndex < catchIndex);
});
