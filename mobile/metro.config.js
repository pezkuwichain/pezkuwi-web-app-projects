// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Monorepo support: Watch and resolve modules from parent directory
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro resolve modules from the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Enable symlinks for shared library
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Handle @pezkuwi/* imports (shared library)
  if (moduleName.startsWith('@pezkuwi/')) {
    const sharedPath = moduleName.replace('@pezkuwi/', '');
    const sharedDir = path.resolve(workspaceRoot, 'shared', sharedPath);

    // Try .ts extension first, then .tsx, then .js
    const extensions = ['.ts', '.tsx', '.js', '.json'];
    for (const ext of extensions) {
      const filePath = sharedDir + ext;
      if (require('fs').existsSync(filePath)) {
        return {
          filePath,
          type: 'sourceFile',
        };
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexPath = path.join(sharedDir, `index${ext}`);
      if (require('fs').existsSync(indexPath)) {
        return {
          filePath: indexPath,
          type: 'sourceFile',
        };
      }
    }
  }

  // Fall back to the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

// Ensure all file extensions are resolved
config.resolver.sourceExts = [
  'expo.ts',
  'expo.tsx',
  'expo.js',
  'expo.jsx',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'wasm',
  'svg',
];

module.exports = config;
