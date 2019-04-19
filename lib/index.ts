import { parseGoPkgConfig, parseGoVendorConfig } from './parser';
import { DepTree, GoPackageManagerType, GoProjectConfig } from './types';

export { GoPackageManagerType };

// To be reused in snyk-go-plugin.
// The plugin, used by Snyk CLI, also scans source files and thus is able to produce
// a proper dependency graph.
export { parseGoPkgConfig, parseGoVendorConfig, GoProjectConfig };

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildGoPkgDepTree(
  manifestFileContents: string,
  lockFileContents: string,
  options?: any): Promise<DepTree> {
  return buildGoDepTree(parseGoPkgConfig(manifestFileContents, lockFileContents));
}

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildGoVendorDepTree(
  manifestFileContents: string,
  options?: any): Promise<DepTree> {
  return buildGoDepTree(parseGoVendorConfig(manifestFileContents));
}

function buildGoDepTree(goProjectConfig: GoProjectConfig) {
  const depTree: DepTree = {
    name: goProjectConfig.packageName || 'root',
    version: '0.0.0',
    dependencies: {},
  };
  for (const dep of Object.keys(goProjectConfig.lockedVersions)) {
    depTree.dependencies[dep] = {
      name: dep,
      version: goProjectConfig.lockedVersions[dep].version,
      dependencies: {},
    };
  }
  return depTree;
}
