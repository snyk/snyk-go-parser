// Go vendor
export interface VendorPackagesEntry {
  checksumSHA1: string;
  path: string;
  revision?: string;
  Revision?: string;
  version?: string;
  Version?: string;
  versionExact: string;
}

// https://github.com/kardianos/vendor-spec
export interface VendorJson {
  ignore?: string;
  package?: VendorPackagesEntry[];
  Package?: VendorPackagesEntry[];
  rootPath?: string; // Undocumented field
}

// Gopkg
export interface GopkgLockEntry {
  name: string;
  packages: string[];
  revision: string;
  version?: string;
}
export interface DepManifest {
  ignored: string[];
}
