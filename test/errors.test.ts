import { buildDepTree } from '../lib';
import { InvalidUserInputError } from '../lib/errors';

const exampleVendorJson = `((rangom garbage, certainly not a JSON))`

it('govendor parsing fails on invalid input', async () => {
	expect(buildDepTree(exampleVendorJson, '', 'govendor')).rejects.toThrow(
		new InvalidUserInputError(`vendor.json parsing failed with error Unexpected token ( in JSON at position 0`),
	);
});

const exampleDep = {
	lock: `((rangom garbage, certainly not a TOML))`,
	manifest: ``,
}

it('dep parsing works', async () => {
	expect(buildDepTree(exampleDep.manifest, exampleDep.lock, 'golangdep')).rejects.toThrow(
		new InvalidUserInputError(`Gopkg.lock parsing failed with error Expected "#", "'", "[", "\\"", "\\n", "\\r", [ \\t], [A-Za-z0-9_\\-] or end of input but "(" found.`),
	);
});
