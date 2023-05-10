import { DepGraphBuilder, DepGraph } from '@snyk/dep-graph';
import { DEFAULT_INITIAL_VERSION } from '../types';

// Modules can be of shape `modules/snyk/inner/v2` or `modules/snyk/v2/inner`
const GO_SEMVER_PREFIXED_MODULES_REGEX = /(.*)\/v[0-9]+(.*)/;
const GO_MODULES = 'gomodules';

function parseGoModGraphLine(line: string): string[][] {
  return line
    .trim()
    .split(/\s/)
    .map((item) => item.split('@'))
    .map(([name, v]) => {
      // Handle cases for prefixed-semver, see https://golang.org/ref/mod#major-version-suffixes
      return [name.replace(GO_SEMVER_PREFIXED_MODULES_REGEX, '$1$2'), v];
    });
}

export function parseGoModGraph(
  goModGraphOutput: string,
  projectName?: string,
  projectVersion: string = DEFAULT_INITIAL_VERSION,
  options: { prune?: boolean } = { prune: true },
): DepGraph {
  const iterationReadyGraph = goModGraphOutput
    .trim()
    .split('\n')
    .filter(Boolean);
  const rootPkgInfo = {
    name: projectName || getModuleName(iterationReadyGraph[0]),
    version: projectVersion,
  };
  const depGraph = new DepGraphBuilder({ name: GO_MODULES }, rootPkgInfo);

  const childrenByParent: Record<
    string,
    { name: string; version: string }[]
  > = {};
  for (const line of iterationReadyGraph) {
    const [
      [parentName, parentVersion = DEFAULT_INITIAL_VERSION],
      [childName, childVersion],
    ] = parseGoModGraphLine(line);
    const parentId = `${parentName}@${parentVersion}`;
    if (parentId in childrenByParent) {
      childrenByParent[parentId].push({
        name: childName,
        version: childVersion,
      });
    } else {
      childrenByParent[parentId] = [{ name: childName, version: childVersion }];
    }
  }

  if (options.prune) {
    dfsVisitPrune(depGraph, rootPkgInfo, childrenByParent);
  } else {
    dfsVisit(depGraph, rootPkgInfo, childrenByParent);
  }

  return depGraph.build();
}

function dfsVisitPrune(
  dgBuilder: DepGraphBuilder,
  node: { name: string; version: string },
  depMap: Record<string, { name: string; version: string }[]>,
  visited?: Set<string>,
) {
  // We have visited undefined only on root node
  const isRootNode = visited === undefined;
  const nodeId = `${node.name}@${node.version}`;
  const parentId = isRootNode ? 'root-node' : nodeId;

  const deps = depMap[nodeId] || [];
  for (const dep of deps) {
    // Scoping our pruning to a particular direct dep
    visited = visited || new Set<string>();
    const depId = `${dep.name}@${dep.version}`;
    if (visited.has(depId)) {
      const prunedId = `${depId}:pruned`;
      dgBuilder.addPkgNode(dep, prunedId, { labels: { pruned: 'true' } });
      dgBuilder.connectDep(parentId, prunedId);
    } else {
      dgBuilder.addPkgNode(dep, depId);
      dgBuilder.connectDep(parentId, depId);
      visited.add(depId);
      dfsVisitPrune(dgBuilder, dep, depMap, visited);
    }
  }
}

function dfsVisit(
  dgBuilder: DepGraphBuilder,
  node: { name: string; version: string },
  depMap: Record<string, { name: string; version: string }[]>,
  visited?: Set<string>,
) {
  // We have visited undefined only on root node
  const isRootNode = visited === undefined;
  const nodeId = `${node.name}@${node.version}`;
  const parentId = isRootNode ? 'root-node' : nodeId;

  const deps = depMap[nodeId] || [];
  for (const dep of deps) {
    // Scoping our pruning to a particular direct dep
    visited = visited || new Set<string>();
    const depId = `${dep.name}@${dep.version}`;

    if (visited.has(depId)) {
      dgBuilder.connectDep(parentId, depId);
      continue;
    }
    dgBuilder.addPkgNode(dep, depId);
    dgBuilder.connectDep(parentId, depId);
    visited.add(depId);
    dfsVisit(dgBuilder, dep, depMap, visited);
  }
}

function getModuleName(firstLine = '') {
  const [[moduleName]] = parseGoModGraphLine(firstLine);
  return moduleName || 'empty';
}
