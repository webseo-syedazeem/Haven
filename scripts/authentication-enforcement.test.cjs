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

test('login back resets only after sign-out and otherwise follows auth history', () => {
  const login = read('app/login.tsx');
  const entry = read('app/index.tsx');
  assert.match(login, /const isSignedOut = signedOut === '1'/);
  assert.match(login, /if \(isSignedOut\) \{[\s\S]{0,180}router\.dismissTo\('\/\?reset=1'\)/);
  assert.match(login, /const isLaunchEntry = launch === '1'/);
  assert.match(login, /if \(isLaunchEntry\) \{\s*router\.dismissTo\('\/\?reset=1'\)/);
  assert.match(login, /safeGoBack\(router, '\/\?reset=1'\)/);
  assert.match(login, /clearIntroSeen\(\)\.then\(\(\) => router\.dismissTo\('\/\?reset=1'\)\)/);
  assert.match(entry, /if \(reset === '1'\) \{\s*setChecking\(false\);/);
  assert.ok(
    entry.indexOf("if (reset === '1')") < entry.indexOf('await restoreSession()'),
    'the explicit public reset must bypass the memoized session restore result'
  );
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

test('completed public onboarding resumes at login instead of the preview', () => {
  const entry = read('app/index.tsx');
  const completedCheck = entry.indexOf('if (await isOnboardingDraftComplete())');
  const progressCheck = entry.indexOf('if (hasOnboardingProgress(answers))');

  assert.ok(completedCheck > -1, 'launch must read the durable onboarding completion flag');
  assert.ok(
    completedCheck < progressCheck,
    'completion must win before persisted answers are interpreted as resumable progress'
  );
  assert.match(
    entry.slice(completedCheck, progressCheck),
    /router\.replace\('\/login\?launch=1'\)/
  );
});

test('Get started clears a completed draft before deliberately restarting onboarding', () => {
  const entry = read('app/index.tsx');
  const handlerStart = entry.indexOf('const handleGetStartedPress');
  const handlerEnd = entry.indexOf('useFocusEffect', handlerStart);
  const handler = entry.slice(handlerStart, handlerEnd);

  assert.match(handler, /if \(await isOnboardingDraftComplete\(\)\)/);
  assert.match(handler, /resetOnboardingDraft\(\)/);
  assert.match(handler, /clearIntroSeen\(\)/);
  assert.match(handler, /router\.push\('\/why-passage'\)/);
  assert.ok(
    handler.indexOf('resetOnboardingDraft()') < handler.indexOf("router.push('/why-passage')"),
    'the completed draft must be deleted before the fresh onboarding route opens'
  );
  assert.match(handler, /getOnboardingResumeRoute\(answers\)/);
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
