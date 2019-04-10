import * as fromFiles from './from-files';
import { DepTree } from './types';



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

  return fromFiles.getDependencies(root, lockFilePath);
}
