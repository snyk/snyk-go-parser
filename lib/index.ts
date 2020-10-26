import {
  parseGoPkgConfig,
  parseGoVendorConfig,
  parseGoModGraph,
} from './parsers';
import {
  DepTree,
  GoPackageManagerType,
  GoPackageConfig,
  ModuleVersion,
  GoModuleConfig,
  DEFAULT_INITIAL_VERSION,
} from './types';

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
  GoModuleConfig,
};

// TODO(kyegupov): make all build* functions sync
// TODO(kyegupov): pin down the types for "options"

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildGoPkgDepTree(
  manifestFileContents: string,
  lockFileContents: string,
  options?: unknown,
): Promise<DepTree> {
  return buildGoDepTree(
    parseGoPkgConfig(manifestFileContents, lockFileContents),
  );
}

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildGoVendorDepTree(
  manifestFileContents: string,
): Promise<DepTree> {
  return buildGoDepTree(parseGoVendorConfig(manifestFileContents));
}

function buildGoDepTree(goProjectConfig: GoPackageConfig) {
  const depTree: DepTree = {
    name: goProjectConfig.packageName || 'root',
    version: DEFAULT_INITIAL_VERSION,
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
