import * as fs from 'fs';
import { parseGoMod, toSnykVersion, parseVersion } from '../lib/gomod-parser';
import { InvalidUserInputError } from '../lib/errors';

const load = (filename: string) =>
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

it('simple example: gomod parsing', async () => {
  const exampleGoMod = load('gomod/simple/go.mod');
  const expectedGoMod = JSON.parse(load('gomod/simple/expected-gomod.json'));
  const gomod = parseGoMod(exampleGoMod);
  expect(gomod).toEqual(expectedGoMod);
});

it('big example: gomod parsing', async () => {
  const exampleGoMod = load('gomod/big/go.mod');
  const expectedGoMod = JSON.parse(load('gomod/big/expected-gomod.json'));
  const gomod = parseGoMod(exampleGoMod);
  expect(gomod).toEqual(expectedGoMod);
});

it('gomod parsing fails on invalid input', async () => {
  const exampleVendorJson = 'some random garbage';
  expect(() => parseGoMod(exampleVendorJson)).toThrow(
    new InvalidUserInputError('go.mod parsing failed with error: Unrecognized statement: some random garbage'),
  );
});

it('gomod parsing fails on empty input', async () => {
  expect(() => parseGoMod('')).toThrow(
    new InvalidUserInputError('No module name specified in go.mod file'),
  );
});

it('toSnykVersion exact version', async () => {
  expect(toSnykVersion(parseVersion('v1.2.3')))
    .toEqual('1.2.3');
});

it('toSnykVersion exact version', async () => {
  expect(toSnykVersion(parseVersion('v0.0.0-20180207000608-0eeff89b0690')))
    .toEqual('#0eeff89b0690');
});
