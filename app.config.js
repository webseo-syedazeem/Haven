module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
    },
  };
};
