const semver = require('semver');

const pkg = require('../package.json');
const expoPkg = require('expo/package.json');
const bundledNativeModules = require('expo/bundledNativeModules.json');

const dependencies = {
  ...pkg.dependencies,
  ...pkg.devDependencies,
};

const expectedVersions = {
  ...bundledNativeModules,
  expo: expoPkg.version,
};

const problems = [];

function isCompatible(declaredRange, expectedRange) {
  const declared = semver.validRange(declaredRange);
  const expected = semver.validRange(expectedRange);

  if (!declared || !expected) {
    return declaredRange === expectedRange;
  }

  return semver.intersects(declared, expected, { includePrerelease: true });
}

for (const [name, declaredRange] of Object.entries(dependencies)) {
  const expectedRange = expectedVersions[name];

  if (!expectedRange || isCompatible(declaredRange, expectedRange)) {
    continue;
  }

  problems.push(`${name}: package.json has ${declaredRange}, Expo SDK expects ${expectedRange}`);
}

for (const name of Object.keys(dependencies)) {
  let installedVersion;

  try {
    installedVersion = require(`${name}/package.json`).version;
  } catch {
    problems.push(`${name}: not installed in node_modules`);
    continue;
  }

  const expectedRange = expectedVersions[name];

  if (expectedRange && !semver.satisfies(installedVersion, expectedRange, { includePrerelease: true })) {
    problems.push(`${name}: installed ${installedVersion}, Expo SDK expects ${expectedRange}`);
  }
}

if (problems.length) {
  console.error('Expo dependency check failed:');
  for (const problem of problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

console.log('Expo dependency check passed.');
