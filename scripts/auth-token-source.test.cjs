/* global __dirname, Response */
// Regression guard for audit C-1: Google/Apple (Supabase-backed) sessions must
// be read LIVE from the Supabase client on every request and refreshed through
// supabase-js on a 401 — never frozen into SecureStore and never force-signed
// out just because there is no Passage refresh token.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

class NetworkError extends Error {
  constructor(message, options) {
    super(message);
    this.name = 'NetworkError';
    this.cause = options?.cause;
  }
}

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function jsonResponse(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function createHarness({ responses, supabase, passage }) {
  const sentTokens = [];
  const secureStoreWrites = [];
  let requests = 0;
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'lib/api/client.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    AbortController,
    process: { env: { EXPO_PUBLIC_API_BASE_URL: 'https://example.test' } },
    fetch: async (_url, init) => {
      const auth = init?.headers?.Authorization ?? null;
      sentTokens.push(auth ? auth.replace('Bearer ', '') : null);
      const response = responses[requests];
      requests += 1;
      if (!response) throw new Error('Unexpected fetch');
      return response;
    },
    setTimeout(callback, delay) {
      // The only timer here is send()'s 15s request-timeout guard, which never
      // fires because the mocked response arrives first.
      if (delay === 15_000) return 1;
      queueMicrotask(callback);
      return 1;
    },
    clearTimeout() {},
    require(id) {
      if (id === '@/lib/api/errors') {
        return {
          ApiError,
          NetworkError,
          isNetworkError: (error) => error instanceof NetworkError,
          isAuthFailure: (error) => error instanceof ApiError && error.status === 401,
        };
      }
      if (id === '@/lib/supabase') return { supabase };
      if (id === 'expo-secure-store') {
        return {
          getItemAsync: async () => null,
          setItemAsync: async (key, value) => { secureStoreWrites.push({ key, value }); },
          deleteItemAsync: async () => {},
        };
      }
      if (id === '@/lib/auth/session-state') {
        return { isGuestModeActive: () => false, setSessionSource: () => {} };
      }
      if (id === '@/lib/auth/offline-session') return { markLoggedOut: async () => {} };
      if (id === '@/lib/passage-api') return passage;
      if (id === 'react-native') return { Platform: { OS: 'ios' } };
      throw new Error('Unexpected client dependency: ' + id);
    },
  });

  return { client: module.exports, sentTokens, secureStoreWrites, requestCount: () => requests };
}

test('a Supabase session is read live and never frozen into SecureStore', async () => {
  const harness = createHarness({
    responses: [jsonResponse(200, { success: true, data: { ok: true } })],
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { access_token: 'live-token' } } }),
        refreshSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => {},
      },
    },
    passage: {
      clearAuthTokens: () => {},
      getAccessToken: () => null, // social user: no Passage token in memory
      getRefreshToken: () => null,
      refreshSession: async () => { throw new Error('Passage refresh must not run for a Supabase session'); },
    },
  });

  await harness.client.apiClient('/api/me');

  assert.deepEqual(harness.sentTokens, ['live-token']);
  // The frozen copy was the C-1 bug — the Supabase token must not be persisted.
  assert.equal(harness.secureStoreWrites.length, 0);
});

test('a 401 on a Supabase session refreshes via supabase-js, not the Passage refresher', async () => {
  let refreshCalls = 0;
  let forcedSignOut = false;
  const harness = createHarness({
    responses: [
      jsonResponse(401, { success: false, error: 'jwt expired' }),
      jsonResponse(200, { success: true, data: { ok: true } }),
    ],
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { access_token: 'expired-token' } } }),
        refreshSession: async () => {
          refreshCalls += 1;
          return { data: { session: { access_token: 'fresh-token' } }, error: null };
        },
        signOut: async () => { forcedSignOut = true; },
      },
    },
    passage: {
      clearAuthTokens: () => {},
      getAccessToken: () => null,
      getRefreshToken: () => null,
      refreshSession: async () => { throw new Error('Passage refresh must not run for a Supabase session'); },
    },
  });

  const result = await harness.client.apiClient('/api/me');

  assert.deepEqual(JSON.parse(JSON.stringify(result)), { success: true, data: { ok: true } });
  assert.equal(refreshCalls, 1);
  assert.equal(forcedSignOut, false); // refresh succeeded — the session stays
  assert.deepEqual(harness.sentTokens, ['expired-token', 'fresh-token']);
});

test('an unrefreshable Supabase session (4xx) is signed out, not left looping', async () => {
  let forcedSignOut = false;
  const harness = createHarness({
    responses: [jsonResponse(401, { success: false, error: 'jwt expired' })],
    supabase: {
      auth: {
        getSession: async () => ({ data: { session: { access_token: 'expired-token' } } }),
        refreshSession: async () => ({ data: { session: null }, error: { status: 400 } }),
        signOut: async () => { forcedSignOut = true; },
      },
    },
    passage: {
      clearAuthTokens: () => {},
      getAccessToken: () => null,
      getRefreshToken: () => null,
      refreshSession: async () => {},
    },
  });

  await assert.rejects(harness.client.apiClient('/api/me'), (error) => error instanceof ApiError && error.status === 401);
  assert.equal(forcedSignOut, true);
});
