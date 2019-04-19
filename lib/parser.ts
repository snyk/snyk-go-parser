import * as toml from 'toml';
import { InvalidUserInputError } from './errors/';
import { GoProjectConfig, LockedDeps } from './types';

export function parseGoPkgConfig(manifestFileContents: string, lockFileContents: string): GoProjectConfig {
  if (!manifestFileContents && !lockFileContents) {
    throw new InvalidUserInputError('Gopkg.lock and Gopkg.toml file contents are empty');
  }
  if (!lockFileContents) {
    throw new InvalidUserInputError('Gopkg.lock is empty, cannot proceed parsing');
  }
  const lockedVersions = parseDepLockContents(lockFileContents);
  let ignoredPkgs: string[] = [];
  if (manifestFileContents) {
    const manifest = parseDepManifestContents(manifestFileContents);
    ignoredPkgs = manifest.ignored;
  }
  return { lockedVersions, ignoredPkgs };
}

export function parseGoVendorConfig(manifestFileContents: string): GoProjectConfig {
  if (!manifestFileContents) {
    throw new InvalidUserInputError('vendor.json file contents are empty');
  }
  return parseGovendorJsonContents(manifestFileContents);
}

// https://golang.github.io/dep/docs/Gopkg.lock.html
interface GopkgLockEntry {
  name: string;
  packages: string[];
  revision: string;
  version?: string;
}

function parseDepLockContents(lockFileString: string): LockedDeps {
  try {
    const lockJson = toml.parse(lockFileString) as { projects: GopkgLockEntry[] };

    const deps: LockedDeps = {};
    if (lockJson.projects) {
      lockJson.projects.forEach((proj) => {
        const version = proj.version || ('#' + proj.revision);

        proj.packages.forEach((subpackageName) => {
          const name =
            (subpackageName === '.' ?
              proj.name :
              proj.name + '/' + subpackageName);

          const dep = {
            name,
            version,
          };

          deps[dep.name] = dep;
        });
      });
    }
    return deps;
  } catch (e) {
    throw new InvalidUserInputError('Gopkg.lock parsing failed with error ' + e.message);
  }
}

export interface DepManifest {
  ignored: string[];
}

function parseDepManifestContents(manifestToml: string): DepManifest {
  try {
    const manifestJson = toml.parse(manifestToml) || {};

    manifestJson.ignored = manifestJson.ignored || [];

    return manifestJson;
  } catch (e) {
    throw new InvalidUserInputError('Gopkg.toml parsing failed with error ' + e.message);
  }
}

// https://github.com/kardianos/vendor-spec
interface VendorJson {
  ignore?: string;
  package?: VendorPackagesEntry[];
  Package?: VendorPackagesEntry[];
  rootPath?: string; // Undocumented field
}

interface VendorPackagesEntry {
  checksumSHA1: string;
  path: string;
  revision?: string;
  Revision?: string;
  version?: string;
  Version?: string;
  versionExact: string;
}

// TODO: branch, old Version can be a tag too?
export function parseGovendorJsonContents(jsonStr: string): GoProjectConfig {
  try {
    const goProjectConfig: GoProjectConfig = {
      ignoredPkgs: [] as string[],
      lockedVersions: {},
    };
    const gvJson = JSON.parse(jsonStr) as VendorJson;

    goProjectConfig.packageName = gvJson.rootPath;

    const packages = (gvJson.package || gvJson.Package);
    if (packages) {
      packages.forEach((pkg) => {
        const revision = pkg.revision || pkg.Revision || pkg.version || pkg.Version;

        const version = pkg.versionExact || ('#' + revision);

        const dep = {
          name: pkg.path,
          version,
        };

        goProjectConfig.lockedVersions[dep.name] = dep;
      });
    }

    const ignores = gvJson.ignore || '';
    ignores.split(/\s/).filter((s) => {
      // otherwise it's a build-tag rather than a pacakge
      return s.indexOf('/') !== -1;
    }).forEach((pkgName) => {
      pkgName = pkgName.replace(/\/+$/, ''); // remove trailing /
      goProjectConfig.ignoredPkgs.push(pkgName);
      goProjectConfig.ignoredPkgs.push(pkgName + '/*');
    });

    return goProjectConfig;
  } catch (e) {
    throw new InvalidUserInputError('vendor.json parsing failed with error ' + e.message);
  }
}
