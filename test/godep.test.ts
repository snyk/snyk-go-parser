import { buildDepTree } from '../lib';
import * as fs from 'fs';

const load = (filename) => JSON.parse(
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8'),
);


it('Gopkg.lock returns expected tree', async () => {
	const exampleGoPkgLock = load('godep/simple/Gopkg.lock');
	const expectedDepTree = load('godep/simple/expected-tree.json');
	const depTree = await buildDepTree('govendor', null, exampleGoPkgLock);
	expect(depTree).toEqual(expectedDepTree);
});

it('Gopkg.lock returns expected tree', async () => {
	const exampleGoPkgLock = load('godep/nexpose-vuln-filter/Gopkg.lock');
	const exampleGoPkgToml = load('godep/nexpose-vuln-filter/Gopkg.toml');
	const expectedDepTree = load('godep/nexpose-vuln-filter/expected-tree.json');
	const depTree = await buildDepTree('govendor', exampleGoPkgToml, exampleGoPkgLock);
	expect(depTree).toEqual(expectedDepTree);
});
