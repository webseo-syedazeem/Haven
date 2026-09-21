const major = Number.parseInt(process.versions.node.split('.')[0], 10);

if (major < 20 || major >= 25) {
  console.error(
    `Unsupported Node.js ${process.version}. This Expo project requires Node 20.x, 22.x or 24.x. ` +
      'Install/use Node from .nvmrc, then run npm run start again.',
  );
  process.exit(1);
}
