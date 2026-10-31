const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('guest profile marks only its Save Your Space navigation', () => {
  const profile = fs.readFileSync(path.join(root, 'app/(tabs)/profile.tsx'), 'utf8');
  assert.match(profile, /welcome\?from=guest-sign-out/);
});

test('guest Save Your Space uses its existing back arrow to reset to Get started', () => {
  const welcome = fs.readFileSync(path.join(root, 'app/welcome.tsx'), 'utf8');

  assert.match(welcome, /from === 'guest-sign-out' && isGuestModeActive\(\)/);
  assert.match(welcome, /const handleBack = useCallback/);
  assert.match(welcome, /if \(!isGuestSignOutFlow\)[\s\S]*router\.back\(\)/);
  assert.match(welcome, /router\.replace\('\/\?reset=1'\)/);
  assert.match(welcome, /onBack=\{handleBack\}/);
});

test('guest Back to Home reuses the auth button and sits above the legal footer', () => {
  const welcome = fs.readFileSync(path.join(root, 'app/welcome.tsx'), 'utf8');

  assert.match(welcome, /footer=\{[\s\S]*\{isGuestSignOutFlow && \([\s\S]*<AuthButton/);
  assert.match(welcome, /label="Back to Home"/);
  assert.match(welcome, /onPress=\{\(\) => resetToMainApp\(router\)\}/);
  assert.match(welcome, /name="home-outline"/);
  assert.match(welcome, /<AuthLegalFooter \/>/);
  assert.match(welcome, /footerContent:[\s\S]*rowGap: 14/);
});

test('guest origin survives the Save Space sign-in and sign-up branches', () => {
  const welcome = fs.readFileSync(path.join(root, 'app/welcome.tsx'), 'utf8');
  const login = fs.readFileSync(path.join(root, 'app/login.tsx'), 'utf8');
  const createAccount = fs.readFileSync(path.join(root, 'app/create-account.tsx'), 'utf8');

  assert.match(welcome, /login\?origin=guest-sign-out/);
  assert.match(welcome, /create-account\?from=onboarding&origin=guest-sign-out/);
  assert.match(login, /welcome\?from=guest-sign-out/);
  assert.match(createAccount, /login\?origin=guest-sign-out/);
});

test('every shared guest account popup opens the Back to Home auth flow', () => {
  const prompt = fs.readFileSync(
    path.join(root, 'components/auth/AccountRequiredPrompt.tsx'),
    'utf8'
  );

  assert.match(prompt, /const isGuest = useGuestModeActive\(\)/);
  assert.match(
    prompt,
    /isGuest \? '\/welcome\?from=guest-sign-out' : '\/welcome'/
  );
});
