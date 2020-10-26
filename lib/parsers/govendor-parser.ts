import { GoPackageConfig } from '../types';
import { InvalidUserInputError } from '../errors';
import { VendorJson } from './types';

function parseGovendorJsonContents(jsonStr: string): GoPackageConfig {
  try {
    const gvJson = JSON.parse(jsonStr) as VendorJson;

    const goProjectConfig: GoPackageConfig = {
      ignoredPkgs: [] as string[],
      lockedVersions: {},
      packageName: gvJson.rootPath!,
    };

    const packages = gvJson.package || gvJson.Package;
    if (packages) {
      packages.forEach((pkg) => {
        const revision =
          pkg.revision || pkg.Revision || pkg.version || pkg.Version;

        const version = pkg.versionExact || '#' + revision;

        const dep = {
          name: pkg.path,
          version,
        };

        goProjectConfig.lockedVersions[dep.name] = dep;
      });
    }

    const ignores = gvJson.ignore || '';
    ignores
      .split(/\s/)
      .filter((s) => {
        // otherwise it's a build-tag rather than a pacakge
        return s.indexOf('/') !== -1;
      })
      .forEach((pkgName) => {
        pkgName = pkgName.replace(/\/+$/, ''); // remove trailing /
        goProjectConfig.ignoredPkgs!.push(pkgName);
        goProjectConfig.ignoredPkgs!.push(pkgName + '/*');
      });

    return goProjectConfig;
  } catch (e) {
    throw new InvalidUserInputError(
      'vendor.json parsing failed with error ' + e.message,
    );
  }
}

export function parseGoVendorConfig(
  manifestFileContents: string,
): GoPackageConfig {
  if (!manifestFileContents) {
    throw new InvalidUserInputError('vendor.json file contents are empty');
  }
  return parseGovendorJsonContents(manifestFileContents);
}
