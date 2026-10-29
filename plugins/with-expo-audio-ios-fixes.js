/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { withDangerousMod } = require('expo/config-plugins');
const { playerEdits, moduleEdits, applyEdits } = require('./ios-audio/patches.cjs');

const originals = {
  'MediaController.swift': 'b719b9063da5fadce68722d54b3623f1abb4152bcbba110ed0fe1ad0e96b1c1f',
  'AudioPlayer.swift': '551e81509191449d491d9a756eefce3102d213e02485cb39493788bcba8901c3',
  'AudioModule.swift': '8ed6bb11ebb4f7b37c38520d7c02fbe31702243559edddd28ec0354ae0c3f39d',
};
const normalize = (source) => source.replace(/\r\n/g, '\n');
const digest = (source) => crypto.createHash('sha256').update(normalize(source)).digest('hex');

function patchSource(name, input) {
  const source = normalize(input);
  if (!(name in originals)) throw new Error(`Unexpected native file: ${name}`);
  if (name === 'MediaController.swift') {
    const replacement = normalize(fs.readFileSync(path.join(__dirname, 'ios-audio', name), 'utf8'));
    if (source === replacement) return source;
    if (digest(source) !== originals[name]) throw new Error(`Unrecognised expo-audio ${name}; reinstall 1.1.1 or review the iOS patch before upgrading.`);
    return replacement;
  }
  const edits = name === 'AudioPlayer.swift' ? playerEdits : moduleEdits;
  // Verify the complete file, even on repeat runs. A marker alone could hide a
  // partial patch or an upstream change. Inversion also makes this idempotent.
  let original = source;
  if (digest(original) !== originals[name]) {
    original = applyEdits(source, [...edits].reverse().map(([before, after, count]) => [after, before, count]));
  }
  if (digest(original) !== originals[name]) throw new Error(`Unrecognised expo-audio ${name}; refusing a partial native patch.`);
  return applyEdits(original, edits);
}

function applyIosAudioFixes(projectRoot) {
  const packageFile = require.resolve('expo-audio/package.json', { paths: [projectRoot] });
  const audioRoot = path.dirname(packageFile);
  const { version } = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (version !== '1.1.1') throw new Error(`Passage iOS audio fixes require expo-audio 1.1.1; found ${version}. Review the backport before changing versions.`);
  // Validate every input before changing any native file.
  const changes = Object.keys(originals).map((name) => {
    const file = path.join(audioRoot, 'ios', name);
    const source = fs.readFileSync(file, 'utf8');
    return { file, source, patched: patchSource(name, source) };
  });
  for (const { file, source, patched } of changes) {
    if (source !== patched) fs.writeFileSync(file, patched);
  }
}

module.exports = function withExpoAudioIosFixes(config) {
  return withDangerousMod(config, ['ios', async (modConfig) => {
    applyIosAudioFixes(modConfig.modRequest.projectRoot);
    return modConfig;
  }]);
};
module.exports.applyIosAudioFixes = applyIosAudioFixes;
module.exports.patchSource = patchSource;
module.exports.originals = originals;

if (require.main === module) {
  applyIosAudioFixes(path.resolve(__dirname, '..'));
  console.log('Applied Passage iOS audio fixes (expo-audio 1.1.1). Rebuild the native iOS app.');
}
