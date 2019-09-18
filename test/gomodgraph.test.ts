import * as fs from 'fs';
import { parseGoModGraph, } from '../lib/gomod-graph-parser';
import { createFromJSON } from '@snyk/dep-graph';
// import { InvalidUserInputError } from '../lib/errors';

const load = (filename: string) =>
    fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

it('simple example: gomod parsing', async () => {
  const exampleGoMod = load('gomod/simple/gomodgraph');
  // const expectedGoMod = JSON.parse(load('gomod/simple/expected-gomod.json'));
  const goModGraph = parseGoModGraph(exampleGoMod, 'github.com/spf13/jwalterweatherman');
  const expectedGraph = createFromJSON(JSON.parse(load('gomod/simple/expected-graph.json')));
  expect(goModGraph.equals(expectedGraph, {compareRoot: true})).toBe(true);
});
