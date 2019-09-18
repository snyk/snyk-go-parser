// import { InvalidUserInputError } from './errors';
// import {DepTree} from './types';
import {DepGraphBuilder, DepGraph, PkgInfo} from '@snyk/dep-graph';

export function parseGoModGraph(goModGraphOutput: string,
                                projectName: string,
                                projectVersion: string = '0.0.0'): DepGraph {

  const rootPkgInfo = {name: projectName, version: projectVersion};
  const depGraph = new DepGraphBuilder({name: 'gomodules'}, rootPkgInfo);

  for (const line of goModGraphOutput.trim().split('\n')) {
    const [[parentName, parentVersion], [childName, childVersion]] = line
        .trim()
        .split(/\s/)
        .map((item) => item.split('@'));

    const parentPkg: PkgInfo = {name: parentName, version: parentVersion || '0.0.0'};
    const childPkg: PkgInfo = {name: childName, version: childVersion || '0.0.0'};
    const parentNodeId = parentName === rootPkgInfo.name ? 'root-node' : `${parentName}@${parentVersion}`;
    const childNodeId = `${childPkg.name}@${childPkg.version}`;
    if (parentPkg.name !== rootPkgInfo.name) {
      depGraph.addPkgNode(parentPkg, parentNodeId);
    }
    depGraph.addPkgNode(childPkg, childNodeId);
    depGraph.connectDep(parentNodeId, childNodeId);
  }

  return depGraph.build();
}
