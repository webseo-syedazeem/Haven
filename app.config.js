module.exports = ({ config }) => {
  const nextConfig = {
    ...config,
    extra: {
      ...(config.extra ?? {}),
    },
  };

  if (!process.env.EAS_BUILD && nextConfig.extra.eas) {
    const localExtra = { ...nextConfig.extra };
    delete localExtra.eas;
    nextConfig.extra = localExtra;
  }

  return nextConfig;
};
