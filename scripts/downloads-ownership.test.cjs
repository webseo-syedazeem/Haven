/* global __dirname */
/**
 * Downloads belong to an account, not to a phone. These run the real
 * `lib/local-downloads.ts` against an in-memory filesystem so the rules that
 * matter can be checked rather than assumed: one user's library is invisible to
 * the next, nothing is ever deleted to make that happen, and a row whose file
 * is not on this device is never offered as playable.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

/** Just enough `expo-file-system` to hold files and directories in a Map. */
function createFileSystem() {
  const files = new Map();
  const directories = new Set(['/doc']);

  const join = (...parts) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');

  class Directory {
    constructor(base, ...rest) {
      this.uri = join(typeof base === 'string' ? base : base.uri, ...rest);
    }
    get exists() {
      return directories.has(this.uri);
    }
    create() {
      directories.add(this.uri);
    }
    delete() {
      directories.delete(this.uri);
      for (const key of [...files.keys()]) {
        if (key.startsWith(this.uri + '/')) files.delete(key);
      }
    }
  }

  class File {
    constructor(base, name) {
      this.uri = name ? join(typeof base === 'string' ? base : base.uri, name) : base;
    }
    get exists() {
      return files.has(this.uri);
    }
    get size() {
      return files.get(this.uri)?.length ?? 0;
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
    static async downloadFileAsync(url, target) {
      files.set(target.uri, 'artwork-bytes:' + url);
      return target;
    }
  }

  return { Directory, File, Paths: { document: '/doc' }, files, directories };
}

function loadDownloads() {
  const fileSystem = createFileSystem();
  const downloaded = [];

  const legacy = {
    createDownloadResumable(url, targetUri, _options, onProgress) {
      return {
        async downloadAsync() {
          onProgress({ totalBytesWritten: 512, totalBytesExpectedToWrite: 1024 });
          fileSystem.files.set(targetUri, 'audio-bytes:' + url);
          downloaded.push(targetUri);
          return { uri: targetUri, status: 200 };
        },
      };
    },
  };

  const source = fs.readFileSync(path.join(root, 'lib/local-downloads.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  const module = { exports: {} };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    console,
    require(id) {
      if (id === 'expo-file-system') return fileSystem;
      if (id === 'expo-file-system/legacy') return legacy;
      if (id === 'expo-network') {
        return { getNetworkStateAsync: async () => ({}), NetworkStateType: {} };
      }
      if (id === 'react-native') return { Platform: { OS: 'ios' } };
      throw new Error('Unexpected downloads dependency: ' + id);
    },
  });

  return { api: module.exports, fileSystem, downloaded };
}

const soundscape = (id) => ({
  id,
  title: 'Soundscape ' + id,
  file_url: 'https://example.test/' + id + '.mp3',
  artwork_url: 'https://example.test/' + id + '.jpg',
});

const USER_A = 'auth-user-a';
const USER_B = 'auth-user-b';

const visible = (api) => api.getLocalDownloadsSnapshot().visibleEntries;

test('a download belongs to the account that made it and follows it back', async () => {
  const { api, fileSystem } = loadDownloads();

  await api.setActiveDownloadUser(USER_A);
  const saved = await api.saveSoundscapeOffline(soundscape('rain'));
  assert.equal(saved.owner_user_id, USER_A);
  assert.equal(saved.status, 'completed');
  assert.ok(api.isLocallyAvailable('rain'));
  assert.equal(api.hasPlayableDownloads(), true);

  const audioUri = saved.file_uri;
  assert.ok(fileSystem.files.has(audioUri));

  // User B takes the same phone.
  await api.setActiveDownloadUser(USER_B);
  assert.equal(api.getLocalDownload('rain'), undefined, 'B must not see the row');
  assert.equal(api.isLocallyAvailable('rain'), false, 'B must not play the file');
  assert.equal(api.hasPlayableDownloads(), false);
  assert.equal(visible(api).length, 0);
  assert.equal(
    api.summariseLocalDownloads(visible(api)).total_bytes,
    0,
    'one account bytes must not count against the other storage bar'
  );
  assert.ok(fileSystem.files.has(audioUri), 'the file itself must survive the switch');

  // And back again.
  await api.setActiveDownloadUser(USER_A);
  assert.equal(api.getLocalDownload('rain')?.status, 'completed');
  assert.ok(api.isLocallyAvailable('rain'));
});

test('one account clearing its downloads never touches the other files', async () => {
  const { api, fileSystem } = loadDownloads();

  await api.setActiveDownloadUser(USER_A);
  const aRow = await api.saveSoundscapeOffline(soundscape('rain'));

  await api.setActiveDownloadUser(USER_B);
  const bRow = await api.saveSoundscapeOffline(soundscape('rain'));
  // The same soundscape saved twice is two files, so neither deletion can
  // reach through to the other.
  assert.notEqual(aRow.file_uri, bRow.file_uri);

  await api.clearLocalDownloads();
  assert.equal(visible(api).length, 0);
  assert.equal(fileSystem.files.has(bRow.file_uri), false, 'the active account file goes');
  assert.ok(fileSystem.files.has(aRow.file_uri), 'the other account file is left alone');

  await api.setActiveDownloadUser(USER_A);
  assert.equal(api.getLocalDownload('rain')?.status, 'completed');

  // A single removal is scoped the same way.
  await api.setActiveDownloadUser(USER_B);
  await api.removeLocalDownload('rain');
  assert.ok(fileSystem.files.has(aRow.file_uri));
});

test('logging out hides every download without deleting anything', async () => {
  const { api, fileSystem } = loadDownloads();

  await api.setActiveDownloadUser(USER_A);
  const saved = await api.saveSoundscapeOffline(soundscape('rain'));

  await api.clearActiveDownloadUser();
  assert.equal(api.getActiveDownloadUserId(), null);
  assert.equal(visible(api).length, 0);
  assert.equal(api.hasPlayableDownloads(), false);
  assert.equal(api.isLocallyAvailable('rain'), false);
  assert.ok(fileSystem.files.has(saved.file_uri), 'logout must not delete audio');

  // Nothing can be removed while nobody owns the device either.
  await api.clearLocalDownloads();
  assert.ok(fileSystem.files.has(saved.file_uri));

  // A download with no account to own it is refused rather than orphaned.
  await assert.rejects(
    () => api.saveSoundscapeOffline(soundscape('waves')),
    (error) => error instanceof api.DownloadRequiresAccountError
  );
});

test('a row written before ownership existed is shown to nobody', async () => {
  const { api, fileSystem } = loadDownloads();

  // A v1 manifest: a completed entry, a real file, and no owner field at all.
  fileSystem.directories.add('/doc/soundscapes');
  fileSystem.files.set('/doc/soundscapes/legacy.mp3', 'audio-bytes:legacy');
  fileSystem.files.set(
    '/doc/soundscapes/manifest.json',
    JSON.stringify({
      version: 1,
      entries: [
        {
          soundscape_id: 'legacy',
          title: 'Legacy',
          status: 'completed',
          file_uri: '/doc/soundscapes/legacy.mp3',
          file_size_bytes: 20,
        },
      ],
    })
  );

  await api.hydrateLocalDownloads();

  for (const user of [USER_A, USER_B]) {
    await api.setActiveDownloadUser(user);
    assert.equal(api.getLocalDownload('legacy'), undefined, user + ' must not inherit it');
    assert.equal(api.isLocallyAvailable('legacy'), false);
    assert.equal(visible(api).length, 0);
  }

  // Hidden, but never destroyed: the bytes and the row are both still there.
  assert.ok(fileSystem.files.has('/doc/soundscapes/legacy.mp3'));
  const stored = JSON.parse(fileSystem.files.get('/doc/soundscapes/manifest.json'));
  assert.equal(stored.entries.length, 1);
  assert.equal(stored.entries[0].owner_user_id, null);
});

test('a server-known download with no file on this device is not playable here', async () => {
  const { api, fileSystem } = loadDownloads();

  // What a fresh install would look like if the account record were trusted:
  // the row says completed, the device has nothing behind it.
  fileSystem.directories.add('/doc/soundscapes');
  fileSystem.files.set(
    '/doc/soundscapes/manifest.json',
    JSON.stringify({
      version: 2,
      active_user_id: USER_A,
      entries: [
        {
          soundscape_id: 'rain',
          owner_user_id: USER_A,
          title: 'Rain',
          status: 'completed',
          file_uri: '/doc/soundscapes/' + USER_A + '-rain.mp3',
          file_size_bytes: 4096,
        },
      ],
    })
  );

  await api.hydrateLocalDownloads();
  assert.equal(api.getActiveDownloadUserId(), USER_A);
  assert.equal(api.isLocallyAvailable('rain'), false, 'no file means not available');
  assert.equal(api.getLocalDownload('rain')?.status, 'failed', 'offered for re-download');
  assert.equal(api.hasPlayableDownloads(), false);
  assert.equal(
    api.summariseLocalDownloads(visible(api)).count,
    0,
    'a row with no bytes must not be counted as stored'
  );

  // Re-downloading here is an ordinary download that lands a real file.
  const saved = await api.saveSoundscapeOffline(soundscape('rain'));
  assert.equal(saved.owner_user_id, USER_A);
  assert.ok(api.isLocallyAvailable('rain'));
});
