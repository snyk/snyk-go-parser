import { parseGoPkgConfig, parseGoVendorConfig } from './parser';
import { parseGoMod, toSnykVersion, parseVersion } from './gomod-parser';
import { parseGoModGraph } from './gomod-graph-parser';
import { DepTree, GoPackageManagerType, GoPackageConfig, ModuleVersion, GoModuleConfig } from './types';

// interface DepDict {
//   [dep: string]: DepTree;
// }
//
// export interface DepTree {
//   name: string;
//   version: string;
//   dependencies?: DepDict;
// }

export { GoPackageManagerType };

// To be reused in snyk-go-plugin.
// The plugin, used by Snyk CLI, also scans source files and thus is able to produce
// a proper dependency graph.
export {
  parseGoPkgConfig,
  parseGoVendorConfig,
  parseGoModGraph,
  GoPackageConfig,
  ModuleVersion,
  toSnykVersion,
  parseVersion,
  GoModuleConfig,
  parseGoMod,
};

// TODO(kyegupov): make all build* functions sync
// TODO(kyegupov): pin down the types for "options"

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildGoPkgDepTree(
  manifestFileContents: string,
  lockFileContents: string,
  options?: unknown): Promise<DepTree> {
  return buildGoDepTree(parseGoPkgConfig(manifestFileContents, lockFileContents));
}

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildGoVendorDepTree(
  manifestFileContents: string,
  options?: unknown): Promise<DepTree> {
  return buildGoDepTree(parseGoVendorConfig(manifestFileContents));
}
//
// export async function buildGoModulesDepTree(
//     manifestFileContents: string,
//     options?: unknown) {
//   return buildGoDepTree(parseGoMod(manifestFileContents));
// }

function buildGoDepTree(goProjectConfig: GoPackageConfig) {
  const depTree: DepTree = {
    name: goProjectConfig.packageName || 'root',
    version: '0.0.0',
    dependencies: {},
  };
  const dependencies = depTree.dependencies!;
  for (const dep of Object.keys(goProjectConfig.lockedVersions)) {
    dependencies[dep] = {
      name: dep,
      version: goProjectConfig.lockedVersions[dep].version,
    };
  }
  return depTree;
}
