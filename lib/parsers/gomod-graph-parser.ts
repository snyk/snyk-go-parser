import * as semver from '@snyk/go-semver';
import { DepGraphBuilder, DepGraph } from '@snyk/dep-graph';
import { DEFAULT_INITIAL_VERSION } from '../types';

// Modules can be of shape `modules/snyk/inner/v2` or `modules/snyk/v2/inner`
const GO_SEMVER_PREFIXED_MODULES_REGEX = /(.*)\/v[0-9]+(.*)/;
const GO_MODULES = 'gomodules';

interface Package {
  name: string;
  version: string;
}

interface Line {
  parent: Package;
  child: Package;
}

export function parseGoModGraph(
  goModGraphOutput: string,
  projectName?: string,
  projectVersion: string = DEFAULT_INITIAL_VERSION,
  opts = { pruneRepeatedSubDependencies: true },
): DepGraph {
  const lines: Line[] = extractLines(goModGraphOutput);
  const maxVersions = getMaxVersions(lines);
  const depMap = getChildrenByParent(lines);
  const rootPkgInfo = {
    name: projectName || lines[0]?.parent.name || 'empty',
    version: projectVersion,
  };
  const dgBuilder = new DepGraphBuilder({ name: GO_MODULES }, rootPkgInfo);
  dfsVisit(
    dgBuilder,
    depMap,
    maxVersions,
    opts.pruneRepeatedSubDependencies,
    rootPkgInfo,
  );
  return dgBuilder.build();
}

function dfsVisit(
  dgBuilder: DepGraphBuilder,
  depMap: Record<string, Package[]>,
  maxVersions: Map<string, string>,
  prune: boolean,
  pkg: Package,
  visited?: Set<string>,
) {
  const isRoot = visited === undefined;
  const nodeId = `${pkg.name}@${pkg.version}`;
  const parentId = isRoot ? 'root-node' : nodeId;
  if (isRoot && !prune) {
    visited = new Set<string>();
  }

  const deps = depMap[nodeId] || [];
  for (const { name, version } of deps) {
    const localVisited = visited || new Set<string>();
    const effectiveDep = { name, version: maxVersions.get(name) || version };
    const depId = `${effectiveDep.name}@${effectiveDep.version}`;

    if (localVisited.has(depId)) {
      if (prune) {
        const prunedId = `${depId}:pruned`;
        dgBuilder.addPkgNode(effectiveDep, prunedId, {
          labels: { pruned: 'true' },
        });
        dgBuilder.connectDep(parentId, prunedId);
      } else {
        dgBuilder.connectDep(parentId, depId);
      }
      continue;
    }

    dgBuilder.addPkgNode(effectiveDep, depId);
    dgBuilder.connectDep(parentId, depId);
    localVisited.add(depId);
    dfsVisit(dgBuilder, depMap, maxVersions, prune, effectiveDep, localVisited);
  }
}

function extractLines(goModGraphOutput: string): Line[] {
  return goModGraphOutput
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [parent, child] = line
        .trim()
        .split(/\s/)
        .map((item) => item.split('@'))
        .map(([name, version]) => ({
          // Handle cases for prefixed-semver
          // see https://golang.org/ref/mod#major-version-suffixes
          name: name.replace(GO_SEMVER_PREFIXED_MODULES_REGEX, '$1$2'),
          version: version,
        }));
      return { parent, child };
    });
}

function getMaxVersions(lines: Line[]): Map<string, string> {
  const maxVersions: Map<string, string> = new Map();
  for (const line of lines) {
    const { child } = line;
    if (
      !maxVersions.has(child.name) ||
      semver.gt(child.version, maxVersions.get(child.name)!)
    ) {
      maxVersions.set(child.name, child.version);
    }
  }
  return maxVersions;
}

function getChildrenByParent(lines: Line[]): Record<string, Package[]> {
  const childrenByParent: Record<string, Package[]> = {};
  for (const line of lines) {
    const { parent, child } = line;
    const parentId = `${parent.name}@${
      parent.version || DEFAULT_INITIAL_VERSION
    }`;
    if (parentId in childrenByParent) {
      childrenByParent[parentId].push(child);
    } else {
      childrenByParent[parentId] = [child];
    }
  }
  return childrenByParent;
}
