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
  missingLockFileEntry?: boolean;
}

export async function buildDepTree(
  manifestFileContents: string,
  lockFileContents: string,
  includeDev = false,
  lockfileType?: string,
  strict = true,
  defaultManifestFileName = 'Gopkg.toml',
): Promise<DepTree> {

  throw new Error('Not implemented');
}

export async function buildDepTreeFromFiles(
  root: string,
  manifestFilePath: string,
  lockFilePath: string,
  includeDev = false,
  strict = true,
): Promise<DepTree> {

  throw new Error('Not implemented');
}
