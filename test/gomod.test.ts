import { buildGoModDepTree } from '../lib';
import * as fs from 'fs';
import { parseGoMod, buildDepTreeFromImports } from '../lib/gomod-parser';
import { InvalidUserInputError } from '../lib/errors';

const load = (filename: string) =>
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

it('simple example: gomod parsing', async () => {
  const exampleGoMod = load('gomod/simple/go.mod');
  const expectedGoMod = JSON.parse(load('gomod/simple/expected-gomod.json'));
  const gomod = parseGoMod(exampleGoMod);
  expect(gomod).toEqual(expectedGoMod);
});

it('simple example: gomod to deptree', async () => {
  const exampleGoMod = load('gomod/simple/go.mod');
  const expectedDepTree = JSON.parse(load('gomod/simple/expected-tree.json'));
  const depTree = buildGoModDepTree(exampleGoMod);
  expect(depTree).toEqual(expectedDepTree);
});

it('big example: gomod parsing', async () => {
  const exampleGoMod = load('gomod/big/go.mod');
  const expectedGoMod = JSON.parse(load('gomod/big/expected-gomod.json'));
  const gomod = parseGoMod(exampleGoMod);
  expect(gomod).toEqual(expectedGoMod);
});

it('big example: gomod to deptree', async () => {
  const exampleGoMod = load('gomod/big/go.mod');
  const expectedDepTree = JSON.parse(load('gomod/big/expected-tree.json'));
  const depTree = buildGoModDepTree(exampleGoMod);
  expect(depTree).toEqual(expectedDepTree);
});

it('gomod parsing fails on invalid input', async () => {
  const exampleVendorJson = 'some random garbage';
  expect(() => buildGoModDepTree(exampleVendorJson)).toThrow(
    new InvalidUserInputError('go.mod parsing failed with error: Unrecognized statement: some random garbage'),
  );
});

it('gomod parsing fails on empty input', async () => {
  expect(() => buildGoModDepTree('')).toThrow(
    new InvalidUserInputError('No module name specified in go.mod file'),
  );
});

it('go list parsing produces first level dependencies', async () => {
  const expectedDepTree = JSON.parse(load('gomod/import/expected-tree.json'));
  const depTree = await buildDepTreeFromImports(`${__dirname}/fixtures/gomod/import`);
  expect(depTree).toEqual(expectedDepTree);
});

it('go list parsing without .go files produces empty tree', async () => {
  const expectedDepTree = JSON.parse(load('gomod/empty/expected-tree.json'));
  const depTree = await buildDepTreeFromImports(`${__dirname}/fixtures/gomod/empty`);
  expect(depTree).toEqual(expectedDepTree);
});
