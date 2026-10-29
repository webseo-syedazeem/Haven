module.exports = ({ config }) => {
  const plugins = Array.isArray(config.plugins) ? config.plugins : [];
  const pluginNames = new Set(plugins.map((plugin) => Array.isArray(plugin) ? plugin[0] : plugin));
  return {
    ...config,
    plugins: [
      ...plugins,
      ...(!pluginNames.has('@sentry/react-native') ? [
        [
          '@sentry/react-native',
          {
            organization: 'o4512329530015744',
            project: '4512329568157776',
          },
        ],
      ] : []),
      ...(!pluginNames.has('expo-localization') ? ['expo-localization'] : []),
    ],
    extra: {
      ...(config.extra ?? {}),
    },
  };
};
