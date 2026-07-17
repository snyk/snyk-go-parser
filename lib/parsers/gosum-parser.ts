import { GoSumEntries } from '../types';

const GO_MOD_SUFFIX = '/go.mod';

// Parse the contents of a go.sum file into a map keyed by `<module>@<version>`.
// Each module version can have up to two entries in a go.sum file:
//   <module> <version> h1:<base64>=          -> hash of the module's file tree (the .zip)
//   <module> <version>/go.mod h1:<base64>=   -> hash of the module's go.mod file
// The hash values are stored verbatim (e.g. "h1:abc...="); callers decide how to
// decode them. See https://go.dev/ref/mod#go-sum-files
export function parseGoSum(goSumContents: string): GoSumEntries {
  const entries: GoSumEntries = {};

  for (const rawLine of goSumContents.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const [modulePath, versionField, hash] = line.split(/\s+/);
    if (!modulePath || !versionField || !hash) {
      continue; // malformed line, skip it
    }

    const isGoMod = versionField.endsWith(GO_MOD_SUFFIX);
    const version = isGoMod
      ? versionField.slice(0, -GO_MOD_SUFFIX.length)
      : versionField;

    const key = `${modulePath}@${version}`;
    const entry = entries[key] || (entries[key] = {});
    if (isGoMod) {
      entry.goModH1 = hash;
    } else {
      entry.h1 = hash;
    }
  }

  return entries;
}
