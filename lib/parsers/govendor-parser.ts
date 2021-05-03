import { GoPackageConfig } from '../types';
import { InvalidUserInputError } from '../errors';
import { VendorJson } from './types';
import { eventLoopSpinner } from 'event-loop-spinner';

async function parseGovendorJsonContents(
  jsonStr: string,
): Promise<GoPackageConfig> {
  try {
    const gvJson = JSON.parse(jsonStr) as VendorJson;

    const goProjectConfig: GoPackageConfig = {
      ignoredPkgs: [] as string[],
      lockedVersions: {},
      packageName: gvJson.rootPath!,
    };

    const packages = gvJson.package || gvJson.Package;
    if (packages) {
      for (const pkg of packages) {
        const revision =
          pkg.revision || pkg.Revision || pkg.version || pkg.Version;

        const version = pkg.versionExact || '#' + revision;

        const dep = {
          name: pkg.path,
          version,
        };

        goProjectConfig.lockedVersions[dep.name] = dep;

        if (eventLoopSpinner.isStarving()) {
          await eventLoopSpinner.spin();
        }
      }
    }

    const ignores = gvJson.ignore || '';
    for (let pkgName of ignores.split(/\s/)) {
      if (pkgName.indexOf('/') === -1) {
        continue; // it's a build-tag rather than a pacakge
      }
      pkgName = pkgName.replace(/\/+$/, ''); // remove trailing /
      goProjectConfig.ignoredPkgs!.push(pkgName);
      goProjectConfig.ignoredPkgs!.push(pkgName + '/*');

      if (eventLoopSpinner.isStarving()) {
        await eventLoopSpinner.spin();
      }
    }

    return goProjectConfig;
  } catch (e) {
    throw new InvalidUserInputError(
      'vendor.json parsing failed with error ' + e.message,
    );
  }
}

export async function parseGoVendorConfig(
  manifestFileContents: string,
): Promise<GoPackageConfig> {
  if (!manifestFileContents) {
    throw new InvalidUserInputError('vendor.json file contents are empty');
  }
  return parseGovendorJsonContents(manifestFileContents);
}
