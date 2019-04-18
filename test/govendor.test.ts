import { buildGoVendorDepTree } from '../lib';
import * as fs from 'fs';

const load = (filename: string) =>
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

it('govendor parsing works', async () => {
	const exampleVendorJson = load('govendor/simple/vendor.json');
	const expectedDepTree = JSON.parse(load('govendor/simple/expected-tree.json'));
	const depTree = await buildGoVendorDepTree(exampleVendorJson);
	expect(depTree).toEqual(expectedDepTree);
});
