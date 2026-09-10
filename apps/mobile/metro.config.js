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


module.exports = withNativeWind(config, { input: './global.css' })