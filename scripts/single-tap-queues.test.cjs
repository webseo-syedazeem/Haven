/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('individual soundscape handlers do not pass their surrounding list as a queue', () => {
  const forbidden = [
    ['app/(tabs)/index.tsx', 'playSoundscape(picked, { queue'],
    ['app/mode/[mode].tsx', 'playSoundscape(item, { queue: section.items })'],
    ['app/collection/[id].tsx', 'playSoundscape(picked, { queue: soundscapes })'],
    ['app/(tabs)/library.tsx', 'playSoundscape(picked, { queue: results })'],
    ['app/(tabs)/saved.tsx', 'playSoundscape(picked, { queue'],
    ['app/(tabs)/saved.tsx', 'playSoundscape(item.soundscape, { queue'],
    ['app/soundscape/[id].tsx', 'playSoundscape(picked, { queue: similar'],
    ['app/playlist/[id].tsx', 'playSoundscape(picked, { queue: tracks })'],
    ['app/welcome.tsx', 'queue: [best, ...alternatives]'],
  ];

  for (const [file, snippet] of forbidden) {
    assert.equal(read(file).includes(snippet), false, `${file} still passes a list queue`);
  }
});

test('Continue Listening resumes one track while both Play All handlers retain full queues', () => {
  const provider = read('lib/player/PlayerProvider.tsx');
  const collection = read('app/collection/[id].tsx');
  const playlist = read('app/playlist/[id].tsx');

  assert.match(provider, /queue:\s*\[resumable\.soundscape\]/);
  assert.match(collection, /playSoundscape\(first,\s*\{ queue: soundscapes \}\)/);
  assert.match(playlist, /playSoundscape\(first,\s*\{ queue: tracks \}\)/);
});
