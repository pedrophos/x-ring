const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Migrations do Drizzle (.sql importado como string).
config.resolver.sourceExts.push('sql');

// expo-sqlite na web: módulo wasm + headers para SharedArrayBuffer
// (o Drizzle usa a API síncrona, que na web exige crossOriginIsolated).
if (!config.resolver.assetExts.includes('wasm')) {
  config.resolver.assetExts.push('wasm');
}
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, metroServer) => {
  const enhanced = enhanceMiddleware ? enhanceMiddleware(middleware, metroServer) : middleware;
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return enhanced(req, res, next);
  };
};

module.exports = config;
