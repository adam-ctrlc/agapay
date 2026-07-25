const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/**
 * Resolves "@/..." explicitly instead of relying on Metro inferring it from
 * the tsconfig paths entry. That inference held locally but not on a clean EAS
 * builder, where every "@/" import failed to resolve and the bundle died.
 */
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = defaultResolveRequest ?? context.resolveRequest;

  if (moduleName.startsWith("@/")) {
    return resolve(
      context,
      path.resolve(__dirname, "src", moduleName.slice(2)),
      platform,
    );
  }

  return resolve(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./src/global.css" });
