import { buildGoPkgDepTree, buildGoVendorDepTree } from '../lib';
import { InvalidUserInputError } from '../lib/errors';

// TODO(kyegupov): move these to godep.test and govendor.test

it('govendor parsing fails on invalid input', async () => {
  const exampleVendorJson = '((rangom garbage, certainly not a JSON))';
  expect(buildGoVendorDepTree(exampleVendorJson)).rejects.toThrow(
new InvalidUserInputError('vendor.json parsing failed with error Unexpected token ( in JSON at position 0'),
  );
});

it('godep parsing fails on invalid input', async () => {
  const exampleGopkglock = '((rangom garbage, certainly not a JSON))';
  expect(buildGoPkgDepTree('', exampleGopkglock)).rejects.toThrow(
    new InvalidUserInputError('Gopkg.lock parsing failed with error ' +
    `Expected "#", "'", "[", "\\"", "\\n", "\\r", [ \\t], [A-Za-z0-9_\\-] or end of input but "(" found.`),
  );
});

it('godep parsing fails when both files are empty', async () => {
  expect(buildGoPkgDepTree('', '')).rejects.toThrow(
    new InvalidUserInputError('Gopkg.lock and Gopkg.toml file contents are empty'),
  );
});

it('govendor parsing fails when file is empty', async () => {
  expect(buildGoVendorDepTree('')).rejects.toThrow(
    new InvalidUserInputError('vendor.json file contents are empty'),
  );
});

it('godep parsing fails when lockfile is empty', async () => {
  expect(buildGoPkgDepTree('# something here', '')).rejects.toThrow(
    new InvalidUserInputError('Gopkg.lock is empty, cannot proceed parsing'),
  );
});
