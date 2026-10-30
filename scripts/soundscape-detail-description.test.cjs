const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const detail = fs.readFileSync(path.join(root, 'app', 'soundscape', '[id].tsx'), 'utf8');
const types = fs.readFileSync(path.join(root, 'lib', 'api', 'home.ts'), 'utf8');

test('soundscape detail renders one plain paragraph with the required fallback', () => {
  assert.match(types, /detail_description\?: string \| null/);
  assert.match(
    detail,
    /soundscape\.detail_description\?\.trim\(\) \|\| soundscape\.one_line_description\?\.trim\(\) \|\| ''/,
  );
  assert.match(detail, /function EditorialDescription\(\{ description \}/);
  assert.match(detail, /const firstParagraph = sentences\.slice\(0, 2\)\.join\(' '\)/);
  assert.match(detail, /const secondParagraph = sentences\.slice\(2\)\.join\(' '\)/);
  assert.match(detail, /const \[leadWordCount, setLeadWordCount\] = useState/);
  assert.match(detail, /if \(lines\.length > 2 && leadWordCount > 1\)/);
  assert.match(detail, /if \(lines\.length < 2 && leadWordCount < maximumLeadWordCount\.current\)/);
  assert.match(detail, /lines\[1\]\.width < lines\[0\]\.width \* 0\.65/);
  assert.match(detail, /onTextLayout=\{handleLeadLayout\}/);
  assert.match(detail, /\{firstLetter\}/);
  assert.match(detail, /\{lead\}/);
  assert.match(detail, /\{firstParagraphContinuation\}/);
  assert.match(detail, /\{secondParagraph\}/);
  assert.match(
    detail,
    /detailDescription:\s*\{[\s\S]*?fontFamily: AppFonts\.displayRegular,[\s\S]*?fontSize: 20,[\s\S]*?lineHeight: 29/,
  );
  assert.match(
    detail,
    /descriptionDropCap:\s*\{[\s\S]*?color: PassageColors\.textPrimary,[\s\S]*?fontFamily: AppFonts\.displayRegular,[\s\S]*?fontSize: 62,[\s\S]*?lineHeight: 59/,
  );
  assert.match(detail, /accessibilityLabel=\{description\}/);
  assert.match(detail, /descriptionParagraphSpacing:\s*\{[\s\S]*?marginTop: 16/);
  for (const removedSection of [
    'Designed For',
    'Contains',
    'Does Not Contain',
    'Best Experienced',
    'Sound Profile',
    'Production Information',
    'Why this works',
  ]) {
    assert.doesNotMatch(detail, new RegExp(removedSection));
  }
  assert.doesNotMatch(detail, /soundscape\.(?:best_use|sound_sources|animals|instruments|perspective|movement|intensity|weather|time_of_day|science_note)/);
  assert.ok(detail.indexOf('styles.artworkFrame') < detail.indexOf('styles.title'));
  assert.ok(detail.indexOf('styles.title') < detail.indexOf('styles.playRow'));
  assert.ok(detail.indexOf('styles.playRow') < detail.indexOf('<EditorialDescription'));
  assert.ok(detail.indexOf('<EditorialDescription') < detail.indexOf('styles.actionRow'));
});

test('playback and listener actions remain available on the detail screen', () => {
  assert.match(detail, /accessibilityLabel=\{`Play \$\{soundscape\.title\}`\}/);
  for (const label of ['Playlist', 'Report']) {
    assert.match(detail, new RegExp(`label="${label}"`));
  }
  assert.match(detail, /label=\{isFavourite \? 'Saved' : 'Save'\}/);
  assert.match(detail, /await playSoundscape\(soundscape\)/);
  assert.match(detail, /router\.push\('\/player'\)/);
});
