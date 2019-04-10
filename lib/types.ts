export interface DepTree {
  name: string;
  version?: string; // Should be present everywhere but the top level
  dependencies: {
    [dep: string]: DepTree;
  };
  depType?: 'prod' | 'dev';
  hasDevDependencies?: boolean;
  missingLockFileEntry?: boolean;

  packageFormatVersion?: string;
  _counts?: any;
  _isProjSubpkg?: boolean;
}