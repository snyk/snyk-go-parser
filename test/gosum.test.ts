import * as fs from 'fs';
import * as path from 'path';
import { parseGoSum } from '../lib';

const load = (filename: string) =>
  fs.readFileSync(`${__dirname}/fixtures/${filename}`, 'utf8');

describe('parseGoSum', () => {
  it('maps module@version to its file-tree and go.mod hashes', () => {
    const goSum = load(path.join('gosum', 'simple', 'go.sum'));

    const entries = parseGoSum(goSum);

    expect(entries['github.com/davecgh/go-spew@v1.1.0']).toEqual({
      h1: 'h1:ZDRjVQ15GmhC3fiQ8ni8+OwkZQO4DARzQgrnXU1Liz8=',
      goModH1: 'h1:J7Y8YcW2NihsgmVo/mv3lAwl/skON4iLHjSsI+c5H38=',
    });
    expect(entries['golang.org/x/text@v0.3.2']).toEqual({
      h1: 'h1:tW2bmiBqwgJj/UpqtC8EpXEZVYOwU0yG4iWbprSVAcs=',
      goModH1: 'h1:bEr9sfX3Q8Zfm5fL9x+3itogRgK3+ptLWKqgva+5dAk=',
    });
  });

  it('records a go.mod-only entry without a file-tree hash', () => {
    const entries = parseGoSum(load(path.join('gosum', 'simple', 'go.sum')));

    expect(entries['github.com/stretchr/objx@v0.1.0']).toEqual({
      goModH1: 'h1:HFkY916IF+rwdDfMAkV7OtwuqBVzrE8GR6GFx+wExME=',
    });
  });

  it('ignores blank and malformed lines', () => {
    const entries = parseGoSum(
      [
        '',
        '   ',
        'github.com/only/two-fields v1.0.0',
        'github.com/valid/mod v1.2.3 h1:tW2bmiBqwgJj/UpqtC8EpXEZVYOwU0yG4iWbprSVAcs=',
      ].join('\n'),
    );

    expect(Object.keys(entries)).toEqual(['github.com/valid/mod@v1.2.3']);
    expect(entries['github.com/valid/mod@v1.2.3']).toEqual({
      h1: 'h1:tW2bmiBqwgJj/UpqtC8EpXEZVYOwU0yG4iWbprSVAcs=',
    });
  });

  it('returns an empty map for empty input', () => {
    expect(parseGoSum('')).toEqual({});
  });
});
