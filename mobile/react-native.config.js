/**
 * O pacote @nozbe/simdjson passou a publicar um podspec proprio, entao o autolinking
 * do Expo/React Native tenta adiciona-lo. Como o plugin do WatermelonDB ja inclui o
 * `pod 'simdjson'` manualmente (com modular_headers, exigido pelo JSI), o autolink gera
 * o erro "multiple dependencies with different sources for simdjson".
 *
 * Desabilitamos o autolink do simdjson no iOS para manter apenas a entrada do plugin.
 */
module.exports = {
  dependencies: {
    '@nozbe/simdjson': {
      platforms: {
        ios: null,
        android: null,
      },
    },
  },
};
