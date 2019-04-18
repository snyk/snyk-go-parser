import { buildDepTree } from '../lib';
import * as fs from 'fs';

const load = (filename) => JSON.parse(
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8'),
);

it('govendor parsing works', async () => {
	const exampleVendorJson = load('govendor/simple/exampleVendorJson.json');
	const expectedDepTree = load('govendor/simple/exampleVendorJson.json');
	const depTree = await buildDepTree(exampleVendorJson, 'govendor');
	expect(depTree).toEqual(expectedDepTree);
});
