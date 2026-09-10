/* global __dirname */
/**
 * `queryClient.clear()` only empties memory. The cache is also written to a file
 * in the app sandbox, and if that file survives a logout the next launch —
 * or the next person to pick up the phone — hydrates the previous user's Home
 * rails, favourites and profile out of it.
 *
 * These run the real `lib/query-persist.ts` against an in-memory filesystem to
 * check the file is genuinely gone from disk, and that a save already in flight
 * when the wipe lands cannot put it back.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadPersist() {
  const files = new Map();

  class Directory {
    constructor(base) {
      this.uri = typeof base === 'string' ? base : base.uri;
    }
  }

  class File {
    constructor(base, name) {
      this.uri = (typeof base === 'string' ? base : base.uri) + '/' + name;
    }
    get exists() {
      return files.has(this.uri);
    }
    create() {
      if (!files.has(this.uri)) files.set(this.uri, '');
    }
    write(value) {
      files.set(this.uri, value);
    }
    async text() {
      return files.get(this.uri) ?? '';
    }
    delete() {
      files.delete(this.uri);
    }
  }

  // The real persister, so the storage adapter is exercised through the same
  // `persistClient` / `removeClient` calls the app uses.
  const persisterModule = require(
    path.join(root, 'node_modules/@tanstack/query-async-storage-persister/build/lib/index.js')
  );

  const source = fs.readFileSync(path.join(root, 'lib/query-persist.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    console,
    Date,
    Promise,
    JSON,
    setTimeout,
    clearTimeout,
    require(id) {
      if (id === '@tanstack/query-async-storage-persister') return persisterModule;
      if (id === 'expo-constants') return { default: { expoConfig: { version: '1.0.0' } } };
      if (id === 'expo-file-system') return { Directory, File, Paths: { document: '/doc' } };
      if (id === 'react-native') return { Platform: { OS: 'ios' } };
      if (id === '@tanstack/react-query-persist-client') return {};
      throw new Error('Unexpected persist dependency: ' + id);
    },
  });

  return { api: module.exports, files };
}

const CACHE_PATH = '/doc/query-cache.json';

const clientFor = (userLabel) => ({
  buster: '1.0.0',
  timestamp: Date.now(),
  clientState: {
    mutations: [],
    queries: [{ queryKey: ['me'], state: { data: { name: userLabel } } }],
  },
});

/** The persister throttles writes, so a save has to be given time to land. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 1200));

test('the persisted cache is removed from disk, not just from memory', async () => {
  const { api, files } = loadPersist();
  const { persister } = api.persistOptions;

  await persister.persistClient(clientFor('user-a'));
  await settle();
  assert.ok(files.has(CACHE_PATH), 'the cache should be on disk to begin with');
  assert.match(files.get(CACHE_PATH), /user-a/);

  await api.clearPersistedQueryCache();
  assert.equal(files.has(CACHE_PATH), false, 'the file must be gone after a logout wipe');
  assert.equal(await persister.restoreClient(), undefined, 'and nothing left to restore');
});

test('a save already in flight cannot put the previous user back on disk', async () => {
  const { api, files } = loadPersist();
  const { persister } = api.persistOptions;

  await persister.persistClient(clientFor('user-a'));
  await settle();
  assert.ok(files.has(CACHE_PATH));

  // The wipe, then the trailing write the throttle had already queued with the
  // pre-logout snapshot in hand.
  await api.clearPersistedQueryCache();
  await persister.persistClient(clientFor('user-a'));
  await settle();

  assert.equal(files.has(CACHE_PATH), false, 'the stale save must be dropped, not written');
});
