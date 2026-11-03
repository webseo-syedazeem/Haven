const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('authentication choice has no unauthenticated app-entry action', () => {
  const welcome = read('app/welcome.tsx');
  assert.doesNotMatch(welcome, /continue\s+as\s+guest/i);
  assert.doesNotMatch(welcome, /setGuestModeActive|isGuestModeActive/);
  assert.match(welcome, /Continue with (Apple|Google)/);
  assert.match(welcome, /Sign up with email/);
});

test('root navigation and tabs redirect signed-out deep links to login', () => {
  const rootLayout = read('app/_layout.tsx');
  const tabs = read('app/(tabs)/_layout.tsx');
  assert.match(rootLayout, /!isExplicitSignOutInFlight\(\)/);
  assert.match(rootLayout, /!PUBLIC_AUTH_ROUTES\.has\(route\)/);
  assert.match(rootLayout, /!PUBLIC_PRE_AUTH_ONBOARDING_ROUTES\.has\(route\)/);
  assert.match(rootLayout, /Redirect href="\/login\?launch=1"/);
  assert.match(tabs, /!hasSession && !isExplicitSignOutInFlight\(\)/);
});

test('Get started includes the public three-clip preview before authentication', () => {
  const entry = read('app/index.tsx');
  const trust = read('app/onboarding/trust.tsx');
  const relaxTrust = read('app/onboarding/relax-trust.tsx');
  const rootLayout = read('app/_layout.tsx');

  assert.match(entry, /getOnboardingResumeRoute\(answers\)/);
  assert.doesNotMatch(entry, /handleGetStartedPress[\s\S]{0,180}router\.push\('\/welcome'/);

  for (const screen of [trust, relaxTrust]) {
    assert.match(screen, /label="Preview the soundscapes"/);
    assert.match(screen, /\/onboarding\/try-passage/);
  }
  assert.match(rootLayout, /'onboarding\/try-passage'/);
});

test('removed session state exposes authenticated sources only', () => {
  const sessionState = read('lib/auth/session-state.ts');
  assert.match(sessionState, /type SessionSource = 'passage' \| 'supabase'/);
  assert.doesNotMatch(sessionState, /guest|anonymous/i);
});

test('catalogue client uses authenticated apiClient', () => {
  const catalogue = read('lib/api/catalogue.ts');
  assert.doesNotMatch(catalogue, /publicApiClient/);
  assert.match(catalogue, /apiClient/);
});

test('home catalogue queries cannot run before session restoration authenticates the user', () => {
  const homeHooks = read('hooks/useHome.ts');
  for (const hook of ['useNewToPassage', 'useShortSessions', 'usePopularCollections', 'useSoundscape']) {
    const start = homeHooks.indexOf(`export function ${hook}`);
    const next = homeHooks.indexOf('\nexport function ', start + 1);
    const body = homeHooks.slice(start, next === -1 ? undefined : next);
    assert.ok(start > -1, `${hook} must exist`);
    assert.match(body, /const hasSession = useHasSession\(\)/, `${hook} must observe auth state`);
    assert.match(body, /enabled: hasSession/, `${hook} must be disabled while signed out`);
  }
});

test('account deletion suppresses auth redirects before the server can revoke the session', () => {
  const passageApi = read('lib/passage-api.ts');
  const deleteStart = passageApi.indexOf('export async function deleteAccount()');
  const deleteBody = passageApi.slice(deleteStart);
  const guardIndex = deleteBody.indexOf('beginExplicitSignOut();');
  const requestIndex = deleteBody.indexOf("apiClient<ApiResponse<{ message?: string }>>('/api/delete-account'");

  assert.ok(deleteStart > -1 && guardIndex > -1 && requestIndex > -1);
  assert.ok(guardIndex < requestIndex, 'the redirect guard must start before account deletion');
  assert.match(deleteBody, /catch \(error\) \{[\s\S]*endExplicitSignOut\(\);[\s\S]*throw error;/);
});
