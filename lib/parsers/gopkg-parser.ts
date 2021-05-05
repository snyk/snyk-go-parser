// https://golang.github.io/dep/docs/Gopkg.lock.html
import { GoPackageConfig, LockedDeps } from '../types';
import * as toml from '@iarna/toml';
import { InvalidUserInputError } from '../errors';
import { DepManifest, GopkgLockEntry } from './types';
import { eventLoopSpinner } from 'event-loop-spinner';

async function parseDepLockContents(
  lockFileString: string,
): Promise<LockedDeps> {
  try {
    const lockJson = ((await toml.parse.async(lockFileString)) as unknown) as {
      projects: GopkgLockEntry[];
    };

    const deps: LockedDeps = {};
    if (lockJson.projects) {
      for (const proj of lockJson.projects) {
        const version = proj.version || '#' + proj.revision;

        for (const subpackageName of proj.packages) {
          const name =
            subpackageName === '.'
              ? proj.name
              : proj.name + '/' + subpackageName;

          const dep = {
            name,
            version,
          };

          deps[dep.name] = dep;

          if (eventLoopSpinner.isStarving()) {
            await eventLoopSpinner.spin();
          }
        }
      }
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
    const manifestJson: any = toml.parse(manifestToml) || {};

    manifestJson.ignored = manifestJson.ignored || [];

    return manifestJson;
  } catch (e) {
    throw new InvalidUserInputError(
      'Gopkg.toml parsing failed with error ' + e.message,
    );
  }
}

export async function parseGoPkgConfig(
  manifestFileContents: string,
  lockFileContents: string,
): Promise<GoPackageConfig> {
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
  const lockedVersions = await parseDepLockContents(lockFileContents);
  let ignoredPkgs: string[] = [];
  if (manifestFileContents) {
    const manifest = parseDepManifestContents(manifestFileContents);
    ignoredPkgs = manifest.ignored;
  }
  return { lockedVersions, ignoredPkgs };
}
