import * as fs from 'fs';
import * as path from 'path';
import { parseGoModRelativeManifestReplaces } from '../lib/parsers/gomod-relative-manifest-parser';

const load = (filename: string) =>
    fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

describe('go mod suite', () => {
  it('parseGoModRelativeManifestReplaces should return all relative manifest files', async () => {
    const exampleGoMod = load(path.join('gomod', 'big', 'go.mod'));
    const relativeManifestFiles = parseGoModRelativeManifestReplaces(exampleGoMod);
    expect(relativeManifestFiles).toMatchSnapshot();
  });
});
