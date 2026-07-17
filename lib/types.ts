export type GoPackageManagerType = 'golangdep' | 'govendor' | 'gomodules';

export interface LockedDep {
  name: string;
  version: string;
}

export interface LockedDeps {
  [dep: string]: LockedDep;
}

export interface GoPackageConfig {
  ignoredPkgs?: string[];
  lockedVersions: LockedDeps;
  packageName?: string;
}

// See https://github.com/golang/vgo/blob/master/vendor/cmd/go/internal/modfile/rule.go
export interface GoModuleConfig {
  moduleName: string;
  golangVersion?: string;
  requires: Require[];
  replaces: Replace[];
  excludes: ModuleAndVersion[];
}

export interface ModuleExactVersion {
  exactVersion: string; // e.g. v1.2.3
  incompatible: boolean;
}

export interface ModulePseudoVersion {
  baseVersion: string; // e.g. v1.2.3 or v1.2.3-rc.1
  suffix: string; // e.g. "", "0.", "pre.0."
  hash: string;
  timestamp: string;
}

export interface ModuleAndVersion {
  moduleName: string;
  version: ModuleVersion;
}

export type ModuleVersion = ModuleExactVersion | ModulePseudoVersion;

export interface Require extends ModuleAndVersion {
  indirect: boolean;
}

export interface ModuleAndMaybeVersion {
  moduleName: string;
  version?: ModuleVersion;
}

export interface Replace {
  oldMod: ModuleAndMaybeVersion;
  newMod: ModuleAndMaybeVersion;
}

export interface DepTree {
  name: string;
  version: string;
  dependencies?: {
    [dep: string]: DepTree;
  };
}

export interface GoSumEntry {
  h1?: string; // hash of the module's file tree, verbatim "h1:..." value from go.sum
  goModH1?: string; // hash of the module's go.mod file, verbatim "h1:..." value
}

export interface GoSumEntries {
  [moduleAtVersion: string]: GoSumEntry;
}

export const DEFAULT_INITIAL_VERSION = '0.0.0';
export const DEFAULT_ROOT_NODE_NAME = 'root-node';
