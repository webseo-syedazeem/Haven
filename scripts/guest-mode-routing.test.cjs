/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadSessionState(asyncStorage, legacyGuestValue = true) {
  const source = fs.readFileSync(path.join(root, 'lib/auth/session-state.ts'), 'utf8');
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
    require(id) {
      if (id === '@react-native-async-storage/async-storage') {
        return {
          __esModule: true,
          default: {
            getItem: async (key) => asyncStorage.get(key) ?? null,
            setItem: async (key, value) => asyncStorage.set(key, value),
            removeItem: async (key) => asyncStorage.delete(key),
          },
        };
      }
      if (id === '@/lib/local-settings') {
        return {
          GUEST_MODE_ACTIVE_DEFAULT: false,
          LOCAL_SETTING_KEYS: { guestModeActive: 'guest_mode_active' },
          getLocalSetting: async () => legacyGuestValue,
          // Simulate a failed/stale legacy write: AsyncStorage must still be
          // authoritative after an explicit sign-out.
          setLocalSetting: async () => undefined,
        };
      }
      throw new Error(`Unexpected session-state dependency: ${id}`);
    },
  });

  return module.exports;
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
  });
}

test('guest=false tombstone prevents a stale legacy guest flag from returning', async () => {
  const storage = new Map();
  const firstLaunch = loadSessionState(storage, true);

  await firstLaunch.hydrateGuestMode();
  assert.equal(firstLaunch.isGuestModeActive(), true);

  await firstLaunch.setGuestModeActive(false);
  assert.equal(firstLaunch.isGuestModeActive(), false);
  assert.equal(storage.get(firstLaunch.GUEST_MODE_STORAGE_KEY), 'false');

  const nextLaunch = loadSessionState(storage, true);
  await nextLaunch.hydrateGuestMode();
  assert.equal(nextLaunch.isGuestModeActive(), false);
});

test('only the explicit Continue as guest handler activates guest mode', () => {
  const calls = ['app', 'components', 'hooks', 'lib']
    .flatMap((directory) => sourceFiles(path.join(root, directory)))
    .flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      const count = (source.match(/setGuestModeActive\s*\(\s*true\s*\)/g) ?? []).length;
      return count ? [{ file: path.relative(root, file).replaceAll('\\', '/'), count }] : [];
    });

  assert.deepEqual(calls, [{ file: 'app/welcome.tsx', count: 1 }]);
  const welcome = fs.readFileSync(path.join(root, 'app/welcome.tsx'), 'utf8');
  assert.match(welcome, /const continueAsGuest[\s\S]*setGuestModeActive\(true\)/);
});

test('signed-out navigation cannot expose tabs as implicit guest mode', () => {
  const login = fs.readFileSync(path.join(root, 'app/login.tsx'), 'utf8');
  const tabs = fs.readFileSync(path.join(root, 'app/(tabs)/_layout.tsx'), 'utf8');
  const navigation = fs.readFileSync(path.join(root, 'lib/navigation.ts'), 'utf8');

  assert.match(login, /isSignedOutLaunch = launch === '1'/);
  assert.match(login, /isFromIntro \|\| isSignedOut \|\| isSignedOutLaunch/);
  assert.match(login, /router\.replace\('\/\?reset=1'\)/);
  assert.match(tabs, /!hasSession && !isGuest/);
  assert.match(tabs, /<Redirect href="\/login\?launch=1" \/>/);
  assert.match(navigation, /router\.replace\('\/login\?signedOut=1' as Href\)/);
});