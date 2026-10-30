/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const ANSWERS_KEY = 'onboarding.answers.v1';
const STORED_KEYS = [
  'calming_moments',
  'main_goal',
  'mode',
  'mode_areas',
  'mode_breakers',
  'relax_causes',
  'target_minutes',
];

function loadOnboarding(options = {}) {
  const storage = new Map();
  let apiCalls = 0;
  const apiRequests = [];
  const importPayloads = [];
  const source = fs.readFileSync(path.join(root, 'lib/onboarding.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    console,
    JSON,
    Map,
    Number,
    Object,
    Promise,
    Set,
    String,
    require(id) {
      if (id === '@/constants/onboarding') {
        return { DURATION_STEP_ENABLED: false };
      }
      if (id === '@/lib/local-settings') {
        return {
          getLocalSetting: async (key, fallback) =>
            storage.has(key) ? storage.get(key) : fallback,
          setLocalSettingStrict: async (key, value) => {
            storage.set(key, JSON.parse(JSON.stringify(value)));
          },
        };
      }
      if (id === '@/lib/api/client') {
        return {
          apiClient: async (requestPath, requestOptions) => {
            apiCalls += 1;
            apiRequests.push({
              path: requestPath,
              body: requestOptions?.body ? JSON.parse(requestOptions.body) : null,
            });
            if (options.apiError) throw options.apiError;
            return { success: true, data: { onboarding: {}, preferences: null } };
          },
        };
      }
      if (id === '@/lib/api/account') {
        return {
          accountApi: {
            importGuestData: async (payload) => {
              apiCalls += 1;
              importPayloads.push(JSON.parse(JSON.stringify(payload)));
              if (options.importError) throw options.importError;
              return {
                favourites_added: 0,
                favourites_skipped: 0,
                playlists_created: 0,
                playlist_items_skipped: 0,
                preferences_applied: false,
                onboarding_applied: options.onboardingApplied ?? true,
              };
            },
          },
        };
      }
      if (id === '@/lib/api/recommendations') {
        return {
          DEFAULT_RECOMMENDATION_ALTERNATIVES: 3,
          MAX_RECOMMENDATION_ALTERNATIVES: 20,
          recommendationsApi: { get: async () => ({ best_match: null, alternatives: [] }) },
        };
      }
      if (id === '@/lib/auth/session-state') {
        return { hasActiveSession: () => options.hasActiveSession ?? true };
      }
      if (id === '@/lib/query-client') {
        return { queryClient: { invalidateQueries: async () => undefined } };
      }
      throw new Error(`Unexpected onboarding dependency: ${id}`);
    },
  });

  return {
    api: module.exports,
    apiCallCount: () => apiCalls,
    apiRequests,
    importPayloads,
    storedAnswers: () => storage.get(ANSWERS_KEY),
  };
}

test('Focus answers persist in the exact backend shape with integer minutes', async () => {
  const harness = loadOnboarding();

  await harness.api.saveOnboardingAnswers({ mode: 'focus' });
  await harness.api.saveOnboardingAnswers({
    mode_breakers: ['Background noise', 'Racing thoughts'],
  });
  await harness.api.saveOnboardingAnswers({
    mode_areas: ['At a desk', 'Creative work'],
    target_minutes: 45,
  });

  const stored = harness.storedAnswers();
  assert.deepEqual(Object.keys(stored).sort(), STORED_KEYS);
  assert.deepEqual(stored, {
    mode: 'focus',
    mode_breakers: ['Background noise', 'Racing thoughts'],
    mode_areas: ['At a desk', 'Creative work'],
    target_minutes: 45,
    main_goal: null,
    relax_causes: [],
    calming_moments: null,
  });
  assert.equal(typeof stored.target_minutes, 'number');
  assert.equal(
    harness.api.isGuestOnboardingReady(await harness.api.getOnboardingAnswers()),
    true
  );
  assert.equal(harness.apiCallCount(), 0);
});

test('Relax answers persist in the exact backend shape without an API call', async () => {
  const harness = loadOnboarding();

  await harness.api.saveOnboardingAnswers({ mode: 'relax' });
  await harness.api.saveOnboardingAnswers({ main_goal: 'Be more present' });
  await harness.api.saveOnboardingAnswers({
    relax_causes: ['Work', 'Overthinking'],
  });
  await harness.api.saveOnboardingAnswers({ calming_moments: 'In the evenings' });

  const stored = harness.storedAnswers();
  assert.deepEqual(Object.keys(stored).sort(), STORED_KEYS);
  assert.deepEqual(stored, {
    mode: 'relax',
    mode_breakers: [],
    mode_areas: [],
    target_minutes: null,
    main_goal: 'Be more present',
    relax_causes: ['Work', 'Overthinking'],
    calming_moments: 'In the evenings',
  });
  assert.equal(
    harness.api.isGuestOnboardingReady(await harness.api.getOnboardingAnswers()),
    true
  );
  assert.equal(harness.apiCallCount(), 0);
});

test('changing mode clears only the previous mode fields', async () => {
  const harness = loadOnboarding();

  await harness.api.saveOnboardingAnswers({
    mode: 'focus',
    mode_breakers: ['Phone distractions'],
    mode_areas: ['At a desk'],
    target_minutes: 25,
  });

  await harness.api.saveOnboardingAnswers({ mode: 'focus' });
  assert.deepEqual(harness.storedAnswers().mode_breakers, ['Phone distractions']);

  await harness.api.saveOnboardingAnswers({ mode: 'sleep' });
  assert.deepEqual(harness.storedAnswers().mode_breakers, []);
  assert.deepEqual(harness.storedAnswers().mode_areas, []);
  assert.equal(harness.storedAnswers().target_minutes, null);

  await harness.api.saveOnboardingAnswers({
    mode_breakers: ['Outside noise'],
    mode_areas: ['Falling asleep'],
    target_minutes: 45,
  });
  await harness.api.saveOnboardingAnswers({ mode: 'relax' });
  assert.deepEqual(harness.storedAnswers().mode_breakers, []);
  assert.deepEqual(harness.storedAnswers().mode_areas, []);
  assert.equal(harness.storedAnswers().target_minutes, null);

  await harness.api.saveOnboardingAnswers({
    main_goal: 'Be more present',
    relax_causes: ['Work'],
    calming_moments: 'In the evenings',
  });
  await harness.api.saveOnboardingAnswers({ mode: 'focus' });
  assert.equal(harness.storedAnswers().main_goal, null);
  assert.deepEqual(harness.storedAnswers().relax_causes, []);
  assert.equal(harness.storedAnswers().calming_moments, null);
});

test('resume routing follows the real mode and mode-specific screen order', () => {
  const { getOnboardingResumeRoute } = loadOnboarding().api;

  assert.equal(getOnboardingResumeRoute({}), '/why-passage');
  assert.equal(getOnboardingResumeRoute({ mode: 'focus' }), '/onboarding/situation');
  assert.equal(
    getOnboardingResumeRoute({
      mode: 'sleep',
      mode_breakers: ['Outside noise'],
    }),
    '/onboarding/personalise'
  );
  assert.equal(
    getOnboardingResumeRoute({
      mode: 'focus',
      mode_breakers: ['Phone distractions'],
      mode_areas: ['At a desk'],
      target_minutes: 25,
    }),
    '/backed-by-science'
  );
  assert.equal(
    getOnboardingResumeRoute({ mode: 'relax' }),
    '/onboarding/relax-main-goal'
  );
  assert.equal(
    getOnboardingResumeRoute({
      mode: 'relax',
      main_goal: 'Be more present',
    }),
    '/onboarding/relax-causes'
  );
  assert.equal(
    getOnboardingResumeRoute({
      mode: 'relax',
      main_goal: 'Be more present',
      relax_causes: ['Work'],
    }),
    '/onboarding/relax-calming-moments'
  );
  assert.equal(
    getOnboardingResumeRoute({
      mode: 'relax',
      main_goal: 'Be more present',
      relax_causes: ['Work'],
      calming_moments: 'In the evenings',
    }),
    '/onboarding/relax-your-fit'
  );
});

test('an authenticated Focus completion posts only Focus fields and clears local answers', async () => {
  const harness = loadOnboarding();

  await harness.api.saveOnboardingAnswers({
    mode: 'focus',
    mode_breakers: ['Phone distractions'],
    mode_areas: ['At a desk'],
    target_minutes: 25,
  });
  await harness.api.completeOnboardingAnswers();

  assert.deepEqual(harness.apiRequests, [
    {
      path: '/api/onboarding',
      body: {
        mode: 'focus',
        mode_breakers: ['Phone distractions'],
        mode_areas: ['At a desk'],
        target_minutes: 25,
      },
    },
  ]);
  assert.equal(harness.storedAnswers().mode, null);
});

test('guest-to-account Relax import is mode-scoped and clears only after acceptance', async () => {
  const harness = loadOnboarding();

  await harness.api.saveOnboardingAnswers({
    mode: 'relax',
    main_goal: 'Be more present',
    relax_causes: ['Work'],
    calming_moments: 'In the evenings',
  });
  await harness.api.markGuestOnboardingComplete();
  await harness.api.migrateGuestOnboardingAfterAuth();

  assert.deepEqual(harness.importPayloads, [
    {
      mode: 'relax',
      main_goal: 'Be more present',
      relax_causes: ['Work'],
      calming_moments: 'In the evenings',
    },
  ]);
  assert.equal(harness.storedAnswers().mode, null);
});

test('failed guest import retains every local onboarding answer for retry', async () => {
  const harness = loadOnboarding({ importError: new Error('offline') });

  await harness.api.saveOnboardingAnswers({
    mode: 'sleep',
    mode_breakers: ['Outside noise'],
    mode_areas: ['Falling asleep'],
    target_minutes: 45,
  });
  await harness.api.markGuestOnboardingComplete();

  await assert.rejects(() => harness.api.migrateGuestOnboardingAfterAuth(), /offline/);
  assert.deepEqual(harness.storedAnswers(), {
    mode: 'sleep',
    mode_breakers: ['Outside noise'],
    mode_areas: ['Falling asleep'],
    target_minutes: 45,
    main_goal: null,
    relax_causes: [],
    calming_moments: null,
  });
});

test('continuing as a guest marks local completion without an onboarding request', async () => {
  const harness = loadOnboarding({ hasActiveSession: false });

  await harness.api.saveOnboardingAnswers({
    mode: 'sleep',
    mode_breakers: ['Outside noise'],
    mode_areas: ['Falling asleep'],
    target_minutes: 45,
  });

  await harness.api.finishOnboardingForAppEntry();

  assert.equal(harness.apiCallCount(), 0);
  assert.deepEqual(harness.storedAnswers(), {
    mode: 'sleep',
    mode_breakers: ['Outside noise'],
    mode_areas: ['Falling asleep'],
    target_minutes: 45,
    main_goal: null,
    relax_causes: [],
    calming_moments: null,
  });
});

test('incomplete authenticated answers are never submitted or cleared', async () => {
  const harness = loadOnboarding();

  await harness.api.saveOnboardingAnswers({
    mode: 'focus',
    mode_breakers: ['Phone distractions'],
  });

  await assert.rejects(
    () => harness.api.completeOnboardingAnswers(),
    /Complete each personalisation step/
  );

  assert.equal(harness.apiCallCount(), 0);
  assert.deepEqual(harness.storedAnswers(), {
    mode: 'focus',
    mode_breakers: ['Phone distractions'],
    mode_areas: [],
    target_minutes: null,
    main_goal: null,
    relax_causes: [],
    calming_moments: null,
  });
});

test('an import response that declines onboarding keeps local answers pending', async () => {
  const harness = loadOnboarding({ onboardingApplied: false });

  await harness.api.saveOnboardingAnswers({
    mode: 'relax',
    main_goal: 'Be more present',
    relax_causes: ['Work'],
    calming_moments: 'In the evenings',
  });
  await harness.api.markGuestOnboardingComplete();

  await assert.rejects(
    () => harness.api.migrateGuestOnboardingAfterAuth(),
    /did not accept the onboarding answers/
  );

  assert.equal(harness.apiCallCount(), 1);
  assert.equal(harness.storedAnswers().mode, 'relax');
  assert.equal(harness.storedAnswers().main_goal, 'Be more present');
});
