/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('the shared onboarding header keeps the brand at the physical screen centre', () => {
  const source = read('components/onboarding/OnboardingBrandHeader.tsx');

  assert.match(source, /left:\s*0,/);
  assert.match(source, /right:\s*0,/);
  assert.match(source, /justifyContent:\s*'center'/);
  assert.match(source, /position:\s*'absolute'/);
  assert.match(source, /left:\s*16,/);
  assert.match(source, /screens-icon\.webp/);
  assert.match(source, /fontSize:\s*20,/);
});

test('every onboarding header variant delegates to the same brand header', () => {
  const sharedHeaderConsumers = [
    'components/onboarding/OnboardingScaffold.tsx',
    'components/onboarding/OnboardingStepHeader.tsx',
    'components/onboarding/RelaxStepHeader.tsx',
    'app/backed-by-science.tsx',
    'app/onboarding/personalise.tsx',
    'app/onboarding/situation.tsx',
    'app/onboarding/trust.tsx',
    'app/onboarding/try-passage.tsx',
  ];

  for (const relativePath of sharedHeaderConsumers) {
    assert.match(
      read(relativePath),
      /<OnboardingBrandHeader\b/,
      `${relativePath} must render the shared onboarding brand header`,
    );
  }
});

test('legacy offset brand-header implementations are absent from onboarding code', () => {
  const onboardingSources = [
    read('components/onboarding/OnboardingScaffold.tsx'),
    read('components/onboarding/OnboardingStepHeader.tsx'),
    read('components/onboarding/RelaxStepHeader.tsx'),
    read('app/backed-by-science.tsx'),
    read('app/onboarding/personalise.tsx'),
    read('app/onboarding/situation.tsx'),
    read('app/onboarding/trust.tsx'),
    read('app/onboarding/try-passage.tsx'),
  ].join('\n');

  assert.doesNotMatch(onboardingSources, /screens-icon-transparent\.webp/);
  assert.doesNotMatch(onboardingSources, /brandCenterAbsolute|headerBackButton/);
});
