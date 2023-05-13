import * as fs from 'fs';
import * as path from 'path';
import {
  parseGoModRelativeManifestReplaces,
  parseGoModVersionDirective,
} from '../lib';
import { MissingGoModVersionDirectiveError } from '../lib/errors';

const load = (filename: string) =>
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

describe('go mod suite', () => {
  it('parseGoModRelativeManifestReplaces should return all relative manifest files', async () => {
    const exampleGoMod = load(path.join('gomod', 'big', 'go.mod'));
    const relativeManifestFiles =
      parseGoModRelativeManifestReplaces(exampleGoMod);
    expect(relativeManifestFiles).toMatchSnapshot();
  });

  it.each([
    {
      fixtureFolderName: 'big',
      expectedVersion: '1.12',
      strict: false,
      shouldFail: false,
    },
    {
      fixtureFolderName: 'semver-prefixed',
      expectedVersion: '1.15',
      strict: true,
      shouldFail: false,
    },
    {
      fixtureFolderName: 'simple',
      expectedVersion: undefined,
      strict: false,
      shouldFail: false,
    },
    {
      fixtureFolderName: 'empty',
      expectedVersion: undefined,
      strict: false,
      shouldFail: false,
    },
    {
      fixtureFolderName: 'empty',
      expectedVersion: undefined,
      strict: true,
      shouldFail: true,
    },
  ])(
    'should extract the version $expectedVersion when reading the go.mod file in folder "$fixtureFolderName"',
    ({ fixtureFolderName, expectedVersion, strict, shouldFail }) => {
      const exampleGoMod = load(
        path.join('gomod', fixtureFolderName, 'go.mod'),
      );

      if (shouldFail) {
        expect(() => parseGoModVersionDirective(exampleGoMod, strict)).toThrow(
          MissingGoModVersionDirectiveError,
        );
        return;
      }

      const actualVersion = parseGoModVersionDirective(exampleGoMod, strict);
      expect(actualVersion).toBe(expectedVersion);
    },
  );
});
