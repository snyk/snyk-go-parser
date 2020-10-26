// https://golang.github.io/dep/docs/Gopkg.lock.html
import { GoPackageConfig, LockedDeps } from '../types';
import * as toml from 'toml';
import { InvalidUserInputError } from '../errors';
import { DepManifest, GopkgLockEntry } from './types';

function parseDepLockContents(lockFileString: string): LockedDeps {
  try {
    const lockJson = toml.parse(lockFileString) as {
      projects: GopkgLockEntry[];
    };

    const deps: LockedDeps = {};
    if (lockJson.projects) {
      lockJson.projects.forEach((proj) => {
        const version = proj.version || '#' + proj.revision;

        proj.packages.forEach((subpackageName) => {
          const name =
            subpackageName === '.'
              ? proj.name
              : proj.name + '/' + subpackageName;

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
    throw new InvalidUserInputError(
      'Gopkg.lock parsing failed with error ' + e.message,
    );
  }
}

function parseDepManifestContents(manifestToml: string): DepManifest {
  try {
    const manifestJson = toml.parse(manifestToml) || {};

    manifestJson.ignored = manifestJson.ignored || [];

    return manifestJson;
  } catch (e) {
    throw new InvalidUserInputError(
      'Gopkg.toml parsing failed with error ' + e.message,
    );
  }
}

export function parseGoPkgConfig(
  manifestFileContents: string,
  lockFileContents: string,
): GoPackageConfig {
  if (!manifestFileContents && !lockFileContents) {
    throw new InvalidUserInputError(
      'Gopkg.lock and Gopkg.toml file contents are empty',
    );
  }
  if (!lockFileContents) {
    throw new InvalidUserInputError(
      'Gopkg.lock is empty, cannot proceed parsing',
    );
  }
  const lockedVersions = parseDepLockContents(lockFileContents);
  let ignoredPkgs: string[] = [];
  if (manifestFileContents) {
    const manifest = parseDepManifestContents(manifestFileContents);
    ignoredPkgs = manifest.ignored;
  }
  return { lockedVersions, ignoredPkgs };
}
