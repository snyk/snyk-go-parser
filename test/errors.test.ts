import { buildGoPkgDepTree, buildGoVendorDepTree } from '../lib';
import { InvalidUserInputError } from '../lib/errors';

it('govendor parsing fails on invalid input', async () => {
  const exampleVendorJson = '((rangom garbage, certainly not a JSON))';
  expect(buildGoVendorDepTree(exampleVendorJson)).rejects.toThrow(
new InvalidUserInputError('vendor.json parsing failed with error Unexpected token ( in JSON at position 0'),
  );
});
it('godep parsing fails on invalid input', async () => {
  const exampleGopkglock = '((rangom garbage, certainly not a JSON))';
  expect(buildGoPkgDepTree(null, exampleGopkglock)).rejects.toThrow(
    new InvalidUserInputError('Gopkg.lock parsing failed with error ' +
    `Expected "#", "'", "[", "\\"", "\\n", "\\r", [ \\t], [A-Za-z0-9_\\-] or end of input but "(" found.`),
  );
});

it('govendor parsing fails when file is null', async () => {
  expect(buildGoPkgDepTree(null, null)).rejects.toThrow(
    new InvalidUserInputError('Gopkg.lock and Gopkg.toml file contents are empty'),
  );
});

it('govendor parsing fails when file is null', async () => {
  expect(buildGoVendorDepTree(null)).rejects.toThrow(
    new InvalidUserInputError('vendor.json file contents are empty'),
  );
});

it('govendor parsing fails when file is null', async () => {
  expect(buildGoPkgDepTree('# something here', null)).rejects.toThrow(
    new InvalidUserInputError('Gopkg.lock is empty, cannot proceed parsing'),
  );
});
