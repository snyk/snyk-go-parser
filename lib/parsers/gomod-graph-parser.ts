import { DepGraphBuilder, DepGraph, PkgInfo } from '@snyk/dep-graph';
import { DEFAULT_INITIAL_VERSION, DEFAULT_ROOT_NODE_NAME } from '../types';

const GO_MODULES = 'gomodules';

function parseGoModGraphLine(line: string): string[][] {
  return line
    .trim()
    .split(/\s/)
    .map((item) => item.split('@'));
}

export function parseGoModGraph(
  goModGraphOutput: string,
  projectName: string,
  projectVersion: string = DEFAULT_INITIAL_VERSION,
): DepGraph {
  const rootPkgInfo = {
    name: projectName.length ? projectName : '',
    version: projectVersion,
  };
  let depGraph = new DepGraphBuilder({ name: GO_MODULES }, rootPkgInfo);

  for (const line of goModGraphOutput.trim().split('\n')) {
    const [
      [parentName, parentVersion = DEFAULT_INITIAL_VERSION],
      [childName, childVersion],
    ] = parseGoModGraphLine(line);
    if (!rootPkgInfo.name?.length) {
      rootPkgInfo.name = parentName; // On first iteration we populate w/ the module name

      // If we updated the package name, we should update to a new DepGraphBuilder
      depGraph = new DepGraphBuilder({ name: GO_MODULES }, rootPkgInfo);
    }
    const parentPkg: PkgInfo = { name: parentName, version: parentVersion };
    const childPkg: PkgInfo = {
      name: childName,
      version: childVersion || DEFAULT_INITIAL_VERSION,
    };
    const parentNodeId =
      parentName === rootPkgInfo.name
        ? DEFAULT_ROOT_NODE_NAME
        : `${parentName}@${parentVersion}`;
    const childNodeId = `${childPkg.name}@${childPkg.version}`;
    if (parentPkg.name !== rootPkgInfo.name) {
      depGraph.addPkgNode(parentPkg, parentNodeId);
    }
    depGraph.addPkgNode(childPkg, childNodeId);
    depGraph.connectDep(parentNodeId, childNodeId);
  }

  return depGraph.build();
}
