const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('trust screens use verified remote testimonials and contain no fabricated publications', () => {
  const screens = `${read('app/onboarding/trust.tsx')}\n${read('app/onboarding/relax-trust.tsx')}`;
  assert.match(screens, /useRemoteTestimonials/);
  assert.doesNotMatch(screens, /FEATURED IN|Guardian|Forbes|Wired|Five out of five/i);
  assert.doesNotMatch(screens, /trust-(maya|daniel|sophie|james)-portrait/i);
  assert.match(screens, /Your evening, uninterrupted/);
  assert.match(screens, /Your space to focus/);
  assert.match(screens, /A softer pause/);
});

test('privacy consent is off by default and exposed in Privacy & Data', () => {
  assert.match(read('lib/observability.ts'), /defaultOptIn: false/);
  assert.match(read('app/profile/privacy-data.tsx'), /Share usage analytics/);
  assert.match(read('lib/analytics.ts'), /if \(!analyticsEnabled\) return/);
});

test('iOS store configuration includes required manifest and native Apple sign-in', () => {
  const config = JSON.parse(read('app.json').replace(/^\uFEFF/, ''));
  assert.equal(config.expo.ios.supportsTablet, false);
  assert.equal(config.expo.ios.usesAppleSignIn, true);
  assert.equal(config.expo.ios.privacyManifests.NSPrivacyAccessedAPITypes.length, 4);
  assert.ok(config.expo.plugins.includes('expo-apple-authentication'));
});

test('Apple authentication is hidden on Android auth entry screens', () => {
  for (const screen of ['app/welcome.tsx', 'app/login.tsx']) {
    const source = read(screen);
    assert.match(source, /Platform\.OS !== 'android'/, `${screen} must hide Apple auth on Android`);
    assert.match(source, /Continue with Apple/);
  }
});
