const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts = [...config.resolver.assetExts, 'otf', 'OTF'];
config.resolver.useWatchman = false;

module.exports = config;
