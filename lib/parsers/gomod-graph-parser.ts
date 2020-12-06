import { DepGraphBuilder, DepGraph, PkgInfo } from '@snyk/dep-graph';
import { DEFAULT_INITIAL_VERSION, DEFAULT_ROOT_NODE_NAME } from '../types';

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
): DepGraph {
  const iterationReadyGraph = goModGraphOutput
    .trim()
    .split('\n')
    .filter(Boolean);
  const moduleName = iterationReadyGraph[0]?.split(/\s/)[0];
  const rootPkgInfo = {
    name: projectName || moduleName || 'empty',
    version: projectVersion,
  };
  const depGraph = new DepGraphBuilder({ name: GO_MODULES }, rootPkgInfo);

  for (const line of iterationReadyGraph) {
    const [
      [parentName, parentVersion = DEFAULT_INITIAL_VERSION],
      [childName, childVersion],
    ] = parseGoModGraphLine(line);

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
