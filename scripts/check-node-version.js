const major = Number.parseInt(process.versions.node.split('.')[0], 10);

if (major < 20 || major >= 23) {
  console.error(
    `Unsupported Node.js ${process.version}. This Expo project requires Node 20.x or 22.x. ` +
      'Install/use Node 20.19.0 from .nvmrc, then run npm run start again.',
  );
  process.exit(1);
}
