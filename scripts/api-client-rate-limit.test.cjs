/* global __dirname, Response */
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

function createClientHarness(responses) {
  const delays = [];
  let requests = 0;
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'lib/api/client.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    process: { env: { EXPO_PUBLIC_API_BASE_URL: 'https://example.test' } },
    fetch: async () => {
      const response = responses[requests];
      requests += 1;
      if (!response) throw new Error('Unexpected fetch');
      return response;
    },
    setTimeout(callback, delay) {
      delays.push(delay);
      queueMicrotask(callback);
      return delays.length;
    },
    clearTimeout() {},
    require(id) {
      if (id === '@/lib/api/errors') {
        return {
          ApiError,
          NetworkError,
          isNetworkError: (error) => error instanceof NetworkError,
        };
      }
      if (id === '@/lib/supabase') {
        return { supabase: { auth: { getSession: async () => ({ data: {} }), signOut: async () => {} } } };
      }
      if (id === 'expo-secure-store') {
        return {
          getItemAsync: async () => null,
          setItemAsync: async () => {},
          deleteItemAsync: async () => {},
        };
      }
      if (id === '@/lib/auth/session-state') {
        return { isGuestModeActive: () => false, setSessionSource: () => {} };
      }
      if (id === '@/lib/auth/offline-session') {
        return { markLoggedOut: async () => {} };
      }
      if (id === '@/lib/haven-api') {
        return {
          clearAuthTokens: () => {},
          getAccessToken: () => null,
          getRefreshToken: () => null,
          refreshSession: async () => {},
        };
      }
      if (id === 'react-native') return { Platform: { OS: 'web' } };
      throw new Error('Unexpected client dependency: ' + id);
    },
  });

  return {
    client: module.exports,
    delays,
    requestCount: () => requests,
  };
}

test('429 responses retry twice with one- then two-second fallback backoff', async () => {
  const harness = createClientHarness([
    jsonResponse(429, { success: false, error: 'Too many requests' }),
    jsonResponse(429, { success: false, error: 'Too many requests' }),
    jsonResponse(200, { success: true, data: { ok: true } }),
  ]);

  const result = await harness.client.publicApiClient('/api/example');
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { success: true, data: { ok: true } });
  assert.equal(harness.requestCount(), 3);
  assert.deepEqual(harness.delays, [1_000, 2_000]);
});

test('429 retry respects Retry-After but bounds a long server window', async () => {
  const harness = createClientHarness([
    jsonResponse(429, { success: false }, { 'Retry-After': '900' }),
    jsonResponse(200, { success: true, data: {} }),
  ]);

  await harness.client.publicApiClient('/api/example');
  assert.equal(harness.requestCount(), 2);
  assert.deepEqual(harness.delays, [10_000]);
});

test('a third 429 is surfaced cleanly without an unbounded retry loop', async () => {
  const harness = createClientHarness([
    jsonResponse(429, { success: false, error: 'Too many requests, please try again later' }),
    jsonResponse(429, { success: false, error: 'Too many requests, please try again later' }),
    jsonResponse(429, { success: false, error: 'Too many requests, please try again later' }),
  ]);

  await assert.rejects(
    harness.client.publicApiClient('/api/example'),
    (error) => error instanceof ApiError
      && error.status === 429
      && error.message === 'Too many requests, please try again later'
  );
  assert.equal(harness.requestCount(), 3);
  assert.deepEqual(harness.delays, [1_000, 2_000]);
});
