import { parseGoConfig, GoProjectConfig, LockedDeps } from './parser';
import { GoPackageManagerType } from './types';

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
export { parseGoConfig, GoProjectConfig, LockedDeps };

// Build dep tree from the manifest/lock files only.
// This does not scan the source code for imports, so it's not accurate;
// in particular, it cannot build the proper dependency graph (only a flat list).
export async function buildDepTree(
  manifestFileContents: string,
  lockFileContents: string,
  lockfileType: GoPackageManagerType,
): Promise<DepTree> {
  const goProjectConfig = parseGoConfig(lockfileType, manifestFileContents, lockFileContents);
  const dependencies: DepDict = {};
  for (const dep of Object.keys(goProjectConfig.lockedVersions)) {
    dependencies[dep] = {
      name: dep,
      version: goProjectConfig.lockedVersions[dep].version,
    };
  }
  return {
    name: goProjectConfig.packageName || 'root',
    version: '0.0.0',
    dependencies,
  };
}
