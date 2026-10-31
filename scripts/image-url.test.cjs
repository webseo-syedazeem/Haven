/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');

function loadImageUrl() {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, 'lib/image-url.ts'), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require(id) {
      throw new Error(`Unexpected image-url dependency: ${id}`);
    },
  });
  return module.exports;
}

const {
  coverCandidateUrls,
  coverUrl,
  initialCachedCoverUrls,
  pickActiveCoverUrl,
} = loadImageUrl();

test('rewrites an original passage_soundscape_images_webp URL to the requested variant folder', () => {
  assert.equal(
    coverUrl('https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp', 'sm'),
    'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp'
  );
  assert.equal(
    coverUrl('https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp', 'md'),
    'https://passagesounds.app/passage_soundscape_images_webp/md/P-S042-x.webp'
  );
  assert.equal(
    coverUrl('https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp', 'lg'),
    'https://passagesounds.app/passage_soundscape_images_webp/lg/P-S042-x.webp'
  );
});

test('passes through null, undefined and the empty string unchanged', () => {
  assert.equal(coverUrl(null, 'sm'), null);
  assert.equal(coverUrl(undefined, 'sm'), undefined);
  assert.equal(coverUrl('', 'sm'), '');
});

test('passes through URLs on other hosts / other paths unchanged', () => {
  assert.equal(
    coverUrl('https://cdn.example.com/avatars/user-123.webp', 'sm'),
    'https://cdn.example.com/avatars/user-123.webp'
  );
  assert.equal(
    coverUrl('https://passagesounds.app/other_folder/P-S042-x.webp', 'sm'),
    'https://passagesounds.app/other_folder/P-S042-x.webp'
  );
});

test('passes through local file:// URIs unchanged', () => {
  const localUri = 'file:///data/user/0/com.passage.app/cache/ImagePicker/abc123.jpg';
  assert.equal(coverUrl(localUri, 'sm'), localUri);
});

test('does not double-rewrite a URL already inside a variant folder', () => {
  const smUrl = 'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp';
  const mdUrl = 'https://passagesounds.app/passage_soundscape_images_webp/md/P-S042-x.webp';
  const lgUrl = 'https://passagesounds.app/passage_soundscape_images_webp/lg/P-S042-x.webp';

  assert.equal(coverUrl(smUrl, 'sm'), smUrl);
  assert.equal(coverUrl(smUrl, 'md'), smUrl); // never rewrites an already-variant URL, even to a different size
  assert.equal(coverUrl(mdUrl, 'lg'), mdUrl);
  assert.equal(coverUrl(lgUrl, 'sm'), lgUrl);
});

test('never throws on malformed-looking input', () => {
  assert.doesNotThrow(() => coverUrl('not a url at all /// passage_soundscape_images_webp/', 'sm'));
  assert.doesNotThrow(() => coverUrl('passage_soundscape_images_webp', 'sm'));
});

test('orders sibling variants before the original when a requested size fails', () => {
  const original = 'https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp';

  assert.deepEqual(Array.from(coverCandidateUrls(original, 'sm')), [
    'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/md/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/lg/P-S042-x.webp',
    original,
  ]);
  assert.deepEqual(Array.from(coverCandidateUrls(original, 'md')), [
    'https://passagesounds.app/passage_soundscape_images_webp/md/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/lg/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp',
    original,
  ]);
});

test('normalizes an already-variant URL so other sizes can still be fallbacks', () => {
  const sm = 'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp';
  assert.deepEqual(Array.from(coverCandidateUrls(sm, 'lg')), [
    'https://passagesounds.app/passage_soundscape_images_webp/lg/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/md/P-S042-x.webp',
    sm,
    'https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp',
  ]);
});

test('full player requests the original first, then falls back through resized files', () => {
  const original = 'https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp';
  assert.equal(coverUrl(original, 'original'), original);
  assert.deepEqual(Array.from(coverCandidateUrls(original, 'original')), [
    original,
    'https://passagesounds.app/passage_soundscape_images_webp/lg/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/md/P-S042-x.webp',
    'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp',
  ]);
});

test('a cached resized file cannot bypass the full player original request', () => {
  const original = 'https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp';
  assert.deepEqual(Array.from(initialCachedCoverUrls(original, 'original')), [original]);
  assert.deepEqual(
    Array.from(initialCachedCoverUrls(original, 'lg')),
    Array.from(coverCandidateUrls(original, 'lg'))
  );
});

// --- CoverImage's one-time fallback-to-original behavior ---------------------------------
// This project has no Jest / React Native Testing Library configured (tests run via plain
// `node --test`), so rendering <CoverImage> and firing a real onError event is not feasible
// here. The fallback decision is pure branching logic factored out of the component into
// pickActiveCoverUrl specifically so it can be exercised directly, covering the same cases an
// onError-driven render test would.

test('pickActiveCoverUrl requests the variant URL by default (nothing has failed yet)', () => {
  const uri = 'https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp';
  const variant = 'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp';

  assert.equal(pickActiveCoverUrl(uri, variant, null), variant);
});

test('pickActiveCoverUrl falls back to the original exactly once it has failed for this uri', () => {
  const uri = 'https://passagesounds.app/passage_soundscape_images_webp/P-S042-x.webp';
  const variant = 'https://passagesounds.app/passage_soundscape_images_webp/sm/P-S042-x.webp';

  // The variant 404s: CoverImage records `fallbackForUri = uri`.
  assert.equal(pickActiveCoverUrl(uri, variant, uri), uri);
  // It does not flip back to the variant on a subsequent render with the same fallback state —
  // there is nothing left to fall back to, so it just keeps serving the original.
  assert.equal(pickActiveCoverUrl(uri, variant, uri), uri);
});

test('pickActiveCoverUrl ignores a fallback recorded for a different uri (recycled list item)', () => {
  const previousUri = 'https://passagesounds.app/passage_soundscape_images_webp/old-item.webp';
  const newUri = 'https://passagesounds.app/passage_soundscape_images_webp/new-item.webp';
  const newVariant = 'https://passagesounds.app/passage_soundscape_images_webp/sm/new-item.webp';

  // A FlatList item got recycled onto a new uri; the previous item's failure must not leak in —
  // the new item gets a fresh attempt at its own variant.
  assert.equal(pickActiveCoverUrl(newUri, newVariant, previousUri), newVariant);
});

test('pickActiveCoverUrl falls back to the original when no variant URL could be produced', () => {
  const uri = 'https://cdn.example.com/avatars/user-123.webp'; // coverUrl would return this unchanged
  assert.equal(pickActiveCoverUrl(uri, undefined, null), uri);
});
