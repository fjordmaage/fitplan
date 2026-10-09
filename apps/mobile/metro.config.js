// Metro, configured for this monorepo: watch the repo root so changes in
// packages/engine reload the app, and resolve modules from both the app's
// node_modules and the hoisted root one.
//
// Do not set `disableHierarchicalLookup`. npm workspaces hoist most packages
// to the root but nest any that conflict, and Expo relies on that: expo-asset
// lives under node_modules/expo/node_modules. Turning off the upward walk
// makes those invisible and the bundle fails to resolve them.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
