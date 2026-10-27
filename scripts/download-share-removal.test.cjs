/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function listSourceFiles(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  const out = [];

  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const relativePath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      out.push(...listSourceFiles(relativePath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(relativePath);
    }
  }

  return out;
}

test('the removed downloads modules are gone and nothing imports them', () => {
  for (const relativePath of ['lib/local-downloads.ts', 'lib/offline-audio.ts', 'hooks/useDownloads.ts']) {
    assert.equal(
      fs.existsSync(path.join(root, relativePath)),
      false,
      `${relativePath} should have been deleted with the downloads feature`
    );
  }

  const sourceFiles = [...listSourceFiles('app'), ...listSourceFiles('components'), ...listSourceFiles('hooks'), ...listSourceFiles('lib')];

  for (const relativePath of sourceFiles) {
    const source = read(relativePath);
    assert.doesNotMatch(
      source,
      /['"]@\/(lib\/local-downloads|lib\/offline-audio|hooks\/useDownloads)['"]/,
      `${relativePath} still imports a module removed with the downloads feature`
    );
  }
});

test('the notification artwork cache is still registered and resolves a cached cover', () => {
  const calls = { getCached: [], fetch: [] };
  let registered = null;

  const source = read('lib/startup-cleanup.ts');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const moduleObj = { exports: {} };
  vm.runInNewContext(compiled, {
    module: moduleObj,
    exports: moduleObj.exports,
    console,
    require(id) {
      if (id === 'expo-file-system') {
        return { Directory: class {
          exists = false;
          create() {}
          delete() {}
        }, Paths: { document: 'file:///doc/', cache: 'file:///cache/' } };
      }
      if (id === 'react-native') return { Platform: { OS: 'ios' } };
      if (id === '@/lib/notification-artwork') {
        return {
          getCachedNotificationArtwork: (url) => {
            calls.getCached.push(url);
            return 'file:///cache/notification-artwork/cover.jpg';
          },
          fetchNotificationArtwork: async (url) => {
            calls.fetch.push(url);
            return 'file:///cache/notification-artwork/cover.jpg';
          },
        };
      }
      if (id === '@/lib/player/types') {
        return { setArtworkCache: (cache) => { registered = cache; } };
      }
      throw new Error('Unexpected startup-cleanup dependency: ' + id);
    },
  });

  assert.ok(registered, 'setArtworkCache must be called when lib/startup-cleanup.ts loads');
  assert.equal(registered.cached('https://example.test/cover.jpg'), 'file:///cache/notification-artwork/cover.jpg');
  assert.deepEqual(calls.getCached, ['https://example.test/cover.jpg']);
});

test('app/_layout.tsx still wires up the startup cleanup that carries the artwork-cache registration', () => {
  const source = read('app/_layout.tsx');

  assert.match(source, /from\s+['"]@\/lib\/startup-cleanup['"]/);
  assert.match(source, /runStartupCleanup\(\)/);
  assert.doesNotMatch(source, /lib\/offline-audio/);
});

test('player, soundscape detail and collection screens no longer offer Download or Share, but keep their other actions', () => {
  const player = read('app/player.tsx');
  assert.doesNotMatch(player, /download/i);
  assert.doesNotMatch(player, /share/i);
  assert.match(player, /accessibilityLabel=\{`Timer,/);
  assert.match(player, /accessibilityLabel="Playlist"/);

  const soundscapeDetail = read('app/soundscape/[id].tsx');
  assert.doesNotMatch(soundscapeDetail, /download/i);
  assert.doesNotMatch(soundscapeDetail, /share/i);
  assert.match(soundscapeDetail, /label="Playlist"/);
  assert.match(soundscapeDetail, /label="Report"/);

  const collectionDetail = read('app/collection/[id].tsx');
  assert.doesNotMatch(collectionDetail, /download/i);
  assert.match(collectionDetail, /accessibilityLabel="Play all"/);
});

test('nothing in app/, components/ or lib/ imports expo-sharing or the react-native Share module', () => {
  const sourceFiles = [
    ...listSourceFiles('app'),
    ...listSourceFiles('components'),
    ...listSourceFiles('lib'),
  ];

  for (const relativePath of sourceFiles) {
    const source = read(relativePath);

    assert.doesNotMatch(
      source,
      /from\s+['"]expo-sharing['"]/,
      `${relativePath} must not import expo-sharing — only hooks/useAccountExport.ts may (data export, not the removed share feature)`
    );

    // A bare `Share` import/usage from react-native is only allowed in the
    // data-export hook, which is outside app/, components/ and lib/.
    assert.doesNotMatch(
      source,
      /\bShare\.share\(/,
      `${relativePath} must not call Share.share — the soundscape share feature was removed`
    );
  }

  // The one legitimate importer, confirmed still wired up for data export.
  const accountExport = read('hooks/useAccountExport.ts');
  assert.match(accountExport, /from\s+['"]expo-sharing['"]/);
  assert.match(accountExport, /Share\.share\(/);
});

test('the Saved tab no longer has a Downloads segment, and keeps the rest', () => {
  const saved = read('app/(tabs)/saved.tsx');

  assert.doesNotMatch(saved, /download/i);
  assert.match(saved, /'favourites'\s*\|\s*'playlists'\s*\|\s*'recent'/);
  assert.match(saved, /label:\s*'Favourites'/);
  assert.match(saved, /label:\s*'Playlists'/);
  assert.match(saved, /label:\s*'Recently Played'/);
});

test('the Profile screen and its stack no longer offer a Downloads row or screen', () => {
  assert.equal(fs.existsSync(path.join(root, 'app/profile/download-settings.tsx')), false);

  const profileLayout = read('app/profile/_layout.tsx');
  assert.doesNotMatch(profileLayout, /download/i);

  const profileScreen = read('app/(tabs)/profile.tsx');
  assert.doesNotMatch(profileScreen, /download/i);
  assert.match(profileScreen, /label:\s*'Account'/);
  assert.match(profileScreen, /label:\s*'Playback'/);
});
