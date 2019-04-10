import * as path from 'path';
import * as fs from 'fs';

export interface DepTree {
  name: string;
  version: string;
  dependencies: {
    [dep: string]: DepTree;
  };
  depType?: 'prod' | 'dev';
  hasDevDependencies?: boolean;
  targetFrameworks?: string[];
  missingLockFileEntry?: boolean;
}

export async function buildDepTreeFromFiles(
  root: string,
  manifestFilePath: string,
  lockFilePath: string,
  includeDev = false,
  strict = true,
): Promise<DepTree> {

  throw new Error("Not implemented");
}