import { buildGoPkgDepTree } from '../lib';
import * as fs from 'fs';

const load = (filename: string) =>
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

it('Gopkg.lock returns expected tree', async () => {
  const exampleGoPkgLock = load('godep/simple/Gopkg.lock');
  const expectedDepTree = JSON.parse(load('godep/simple/expected-tree.json'));
  const depTree = await buildGoPkgDepTree('', exampleGoPkgLock);
  expect(depTree).toEqual(expectedDepTree);
});

it('Gopkg.lock returns expected tree', async () => {
  const exampleGoPkgLock = load('godep/nexpose-vuln-filter/Gopkg.lock');
  const exampleGoPkgToml = load('godep/nexpose-vuln-filter/Gopkg.toml');
  const expectedDepTree = JSON.parse(
    load('godep/nexpose-vuln-filter/expected-tree.json'),
  );
  const depTree = await buildGoPkgDepTree(exampleGoPkgToml, exampleGoPkgLock);
  expect(depTree).toEqual(expectedDepTree);
});
