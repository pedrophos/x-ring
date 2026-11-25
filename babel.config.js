module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Migrations do Drizzle são arquivos .sql importados como string.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
