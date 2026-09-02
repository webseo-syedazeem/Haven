const { getDefaultConfig } = require('expo/metro-config');

// Metro's fallback watcher registers every folder on Windows and can exceed
// its startup timeout on slow/virtual drives. Windows supports recursive
// fs.watch, so use Metro's native watcher instead.
if (process.platform === 'win32') {
  const path = require('path');
  const metroFileMapRoot = path.dirname(
    require.resolve('metro-file-map/package.json'),
  );
  const NativeWatcher = require(
    path.join(metroFileMapRoot, 'src/watchers/NativeWatcher'),
  ).default;
  NativeWatcher.isSupported = () => true;

  // Windows may emit a recursive fs.watch event without a relative filename.
  // Metro assumes it is always present, so ignore non-actionable null events.
  const handleEvent = NativeWatcher.prototype._handleEvent;
  NativeWatcher.prototype._handleEvent = function (relativePath) {
    if (relativePath == null) return Promise.resolve();
    return handleEvent.call(this, relativePath);
  };
}

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'otf', 'OTF'];
config.resolver.useWatchman = false;

module.exports = config;
