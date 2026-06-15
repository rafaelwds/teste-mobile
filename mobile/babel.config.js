module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // WatermelonDB usa decorators legados nos models (@field, @date, etc).
    plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]],
  };
};
