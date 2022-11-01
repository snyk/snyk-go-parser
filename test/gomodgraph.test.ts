import * as fs from 'fs';
import { parseGoModGraph, } from '../lib';
import { createFromJSON } from '@snyk/dep-graph';
import * as path from 'path';
import {normalizeVersion} from '../lib/parsers/gomod-graph-parser';

const load = (filename: string) =>
    fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

it('simple example: gomod parsing', async () => {
  const exampleGoMod = load(path.join('gomod', 'simple', 'gomodgraph'));
  const goModGraph = parseGoModGraph(exampleGoMod, 'github.com/spf13/jwalterweatherman');
  const expectedGraph = createFromJSON(JSON.parse(load(path.join('gomod', 'simple', 'expected-graph.json'))));
  expect(goModGraph.equals(expectedGraph, {compareRoot: true})).toBe(true);
});

it('empty example: gomod parsing', async () => {
  const exampleGoMod = load(path.join('gomod', 'empty', 'gomodgraph'));
  const goModGraph = parseGoModGraph(exampleGoMod, '');
  const expectedGraph = createFromJSON(JSON.parse(load(path.join('gomod', 'empty', 'expected-graph.json'))));
  try {
    expect(goModGraph.equals(expectedGraph, {compareRoot: true})).toBe(true);
  } catch (e) {
    expect(goModGraph.toJSON()).toEqual(expectedGraph.toJSON());
  }
});

it('prefix versioning support', async () => {
  const exampleGoMod = load(path.join('gomod', 'semver-prefixed', 'gomodgraph'));
  const goModGraph = parseGoModGraph(exampleGoMod, '');
  const expectedGraph = createFromJSON(JSON.parse(load(path.join('gomod', 'semver-prefixed', 'expected-graph.json'))));
  try {
    expect(goModGraph.equals(expectedGraph, {compareRoot: true})).toBe(true);
  } catch (e) {
    expect(goModGraph.toJSON()).toEqual(expectedGraph.toJSON());
  }
});

describe('normalizeVersion fn', () => {
  const cases = [
    ['vX.0.0-20220126234351-abcdefabcdef', '#abcdefabcdef'],
    ['vX.Y.Z-pre.0.20220126234351-abcdefabcdef', '#abcdefabcdef'],
    ['vX.Y.(Z+1)-0.20220126234351-abcdefabcdef', '#abcdefabcdef'],
    ['v0.0.1', 'v0.0.1'],
    ['v0.0.1-0', 'v0.0.1-0'],
    ['v0.0.1-beta.2', 'v0.0.1-beta.2'],
    ['', ''],
    [undefined, undefined],

  ];

  it.each(cases)('normalizeVersion(%s) should return %s', (email, expected) => {
    expect(normalizeVersion(email)).toEqual(expected);
  });
});
