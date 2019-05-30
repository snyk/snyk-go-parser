import { parseGoPkgConfig, parseGoVendorConfig } from './parser';
import { parseGoMod, toSnykVersion, parseVersion } from './gomod-parser';
import { DepTree, GoPackageManagerType, GoProjectConfig, ModuleVersion } from './types';

interface DepDict {
  [dep: string]: DepTree;
}

export interface DepTree {
  name: string;
  version: string;
  dependencies?: DepDict;
}

export { GoPackageManagerType };

// To be reused in snyk-go-plugin.
// The plugin, used by Snyk CLI, also scans source files and thus is able to produce
// a proper dependency graph.
export { parseGoPkgConfig, parseGoVendorConfig, GoProjectConfig, ModuleVersion, toSnykVersion, parseVersion };

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

// We are not using go.sum file here because it's not actually a lockfile and contains dependencies
// that are actually long gone.
export function buildGoModDepTree(
  manifestFileContents: string,
  options?: unknown,
): DepTree {
  // We actually use only some bits of the go.mod contents
  const goMod = parseGoMod(manifestFileContents);
  const depTree: DepTree = {
    name: goMod.moduleName,
    version: '0.0.0',
    dependencies: {},
  };
  const dependencies = depTree.dependencies!;
  for (const req of goMod.requires) {
    dependencies[req.moduleName] = {
      name: req.moduleName,
      version: toSnykVersion(req.version),
    };
  }
  return depTree;
}

function buildGoDepTree(goProjectConfig: GoProjectConfig) {
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
