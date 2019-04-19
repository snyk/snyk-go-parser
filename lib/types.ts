export type GoPackageManagerType = 'golangdep'|'govendor';

export interface LockedDep {
  name: string;
  version: string;
}

export interface LockedDeps {
  [dep: string]: LockedDep;
}

export interface GoProjectConfig {
  ignoredPkgs: string[];
  lockedVersions: LockedDeps;
  packageName?: string;
}

export interface DepTree {
  name: string;
  version: string;
  dependencies?: {
    [dep: string]: DepTree;
  };
}
