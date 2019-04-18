import { buildDepTree } from '../lib';
import { InvalidUserInputError } from '../lib/errors';

it('govendor parsing fails on invalid input', async () => {
	const exampleVendorJson = '((rangom garbage, certainly not a JSON))';
	expect(buildDepTree('govendor', exampleVendorJson)).rejects.toThrow(
new InvalidUserInputError('vendor.json parsing failed with error Unexpected token ( in JSON at position 0'),
	);
});
it('godep parsing fails on invalid input', async () => {
	const exampleGopkglock = '((rangom garbage, certainly not a TOML))';
	expect(buildDepTree('golangdep', null, exampleGopkglock)).rejects.toThrow(
		new InvalidUserInputError(`Gopkg.lock parsing failed with error Expected "#", "'", "[", "\\"", "\\n", "\\r", [ \\t], [A-Za-z0-9_\\-] or end of input but "(" found.`),
	);
});

it('govendor parsing fails on invalid input', async () => {
	expect(buildDepTree(null, 'govendor')).rejects.toThrow(
		new Error("Missing required parametes to build a tree"),
	);
});

it('godep parsing fails on invalid input', async () => {
	const exampleGopkglock = '((rangom garbage, certainly not a TOML))';
	expect(buildDepTree('golangdep', null, null)).rejects.toThrow(
		new Error("Missing required parametes to build a tree"),
	);
});
