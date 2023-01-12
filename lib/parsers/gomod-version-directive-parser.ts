import { MissingGoModVersionDirectiveError } from '../errors';

// Parse the Go version directive from the go.mod file, if defined.
// The logic is more or less identical to the actual `go` command's. See more here:
// https://cs.opensource.google/go/x/mod/+/7c05a442b7c1d1a107879b4a090bb5a38d3774a1:modfile/rule.go;l=342-362
const GoVersionRE = /^go\s(?<version>([1-9][0-9]*)\.(0|[1-9][0-9]*))/m;

// Attempt to parse the go directive out of a go.mod file, either in strict mode or not.
// If strict mode, will cause a failure if no version is found, otherwise just return undefined.
// Both options are available as different versions of the go cli tool have acted differently around this issue.
export function parseGoModVersionDirective(
  goModFileContent: string,
  strict = true,
): string | undefined | MissingGoModVersionDirectiveError {
  const version = GoVersionRE.exec(goModFileContent);

  if (!version) {
    if (strict) {
      // No strict version was found, and we needed one to be defined.
      throw new MissingGoModVersionDirectiveError(
        'go.mod file must have a go version directive and must match format 1.23',
      );
    }
    return undefined;
  }

  return version[1];
}
