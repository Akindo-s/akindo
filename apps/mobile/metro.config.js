const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 


const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];

config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// NOTE: `disableHierarchicalLookup` must stay off here. It is part of Expo's
// monorepo guide for Yarn/npm, where hoisting makes node_modules flat. pnpm
// keeps transitive deps nested under .pnpm/<pkg>/node_modules, so Metro has to
// be allowed to walk up from the importing file to find them.


// inlineRem 16 = el rem de web (el default del navegador). nativewind usa 14 en
// nativo si no se le dice nada, y todo lo que es rem (p-4, text-xs, max-w-md,
// ...) salia ~12% mas chico que en web.
module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 })