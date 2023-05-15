import * as path from 'path';
import * as fs from 'fs';
import { parseGoModGraph } from '../lib';
import { createFromJSON } from '@snyk/dep-graph';

const load = (...args: string[]) =>
  fs.readFileSync(path.join(__dirname, 'fixtures', ...args), 'utf8');

const format = (str: string) => {
  return str
    .split('\n')
    .map((s) => s.trim())
    .join('\n');
};

describe('basic gomodgraph parsing', () => {
  it('returns package manager', () => {
    const input = `
      com.example/app github.com/example/lib@v1.0.0
    `;
    const depGraph = parseGoModGraph(input, 'com.example/app');
    expect(depGraph.pkgManager).toMatchObject({ name: 'gomodules' });
  });

  it('returns root package', () => {
    const input = `
      com.example/app github.com/example/lib@v1.0.0
    `;
    const depGraph = parseGoModGraph(input);
    expect(depGraph.rootPkg).toMatchObject({
      name: 'com.example/app',
      version: '0.0.0',
    });
  });

  it('returns root package with supplied name and version', () => {
    const input = `
      com.example/app github.com/example/lib@v1.0.0
    `;
    const depGraph = parseGoModGraph(input, 'com.example/app', 'v1.1.1');
    expect(depGraph.rootPkg).toMatchObject({
      name: 'com.example/app',
      version: 'v1.1.1',
    });
  });

  it('returns packages', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/b@v2.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app');
    expect(depGraph.getPkgs()).toEqual([
      { name: 'com.example/app', version: '0.0.0' },
      { name: 'github.com/example/a', version: 'v1.0.0' },
      { name: 'github.com/example/b', version: 'v2.0.0' },
    ]);
  });

  it('returns packages - version prefix / suffix', () => {
    const input = format(`
      com.example/app github.com/example/v1/a@v1.0.0
      com.example/app github.com/example/b/v2@v2.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app');
    expect(depGraph.getPkgs()).toEqual([
      { name: 'com.example/app', version: '0.0.0' },
      { name: 'github.com/example/a', version: 'v1.0.0' },
      { name: 'github.com/example/b', version: 'v2.0.0' },
    ]);
  });

  it('returns package dependencies', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/b@v2.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app');
    expect(depGraph.toJSON().graph.nodes).toMatchObject([
      {
        nodeId: 'root-node',
        pkgId: 'com.example/app@0.0.0',
        deps: [{ nodeId: 'github.com/example/a@v1.0.0' }],
      },
      {
        nodeId: 'github.com/example/a@v1.0.0',
        pkgId: 'github.com/example/a@v1.0.0',
        deps: [{ nodeId: 'github.com/example/b@v2.0.0' }],
      },
      {
        nodeId: 'github.com/example/b@v2.0.0',
        pkgId: 'github.com/example/b@v2.0.0',
        deps: [],
      },
    ]);
  });

  it('returns package dependencies - cyclical dependencies, un-pruned', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/b@v2.0.0
      github.com/example/b@v2.0.0 github.com/example/a@v1.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app', undefined, {
      pruneRepeatedSubDependencies: false,
    });
    expect(depGraph.toJSON().graph.nodes).toMatchObject([
      {
        nodeId: 'root-node',
        pkgId: 'com.example/app@0.0.0',
        deps: [{ nodeId: 'github.com/example/a@v1.0.0' }],
      },
      {
        nodeId: 'github.com/example/a@v1.0.0',
        pkgId: 'github.com/example/a@v1.0.0',
        deps: [{ nodeId: 'github.com/example/b@v2.0.0' }],
      },
      {
        nodeId: 'github.com/example/b@v2.0.0',
        pkgId: 'github.com/example/b@v2.0.0',
        deps: [{ nodeId: 'github.com/example/a@v1.0.0' }],
      },
    ]);
  });

  it('returns package dependencies - cyclical dependencies, pruned', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/b@v2.0.0
      github.com/example/b@v2.0.0 github.com/example/a@v1.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app');
    expect(depGraph.toJSON().graph.nodes).toMatchObject([
      {
        nodeId: 'root-node',
        pkgId: 'com.example/app@0.0.0',
        deps: [{ nodeId: 'github.com/example/a@v1.0.0' }],
      },
      {
        nodeId: 'github.com/example/a@v1.0.0',
        pkgId: 'github.com/example/a@v1.0.0',
        deps: [{ nodeId: 'github.com/example/b@v2.0.0' }],
      },
      {
        nodeId: 'github.com/example/b@v2.0.0',
        pkgId: 'github.com/example/b@v2.0.0',
        deps: [{ nodeId: 'github.com/example/a@v1.0.0:pruned' }],
      },
      {
        nodeId: 'github.com/example/a@v1.0.0:pruned',
        pkgId: 'github.com/example/a@v1.0.0',
        deps: [],
      },
    ]);
  });

  it('selects maximum package versions', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      com.example/app github.com/example/c@v1.0.0
      com.example/app github.com/example/f@v0.0.0-20190702054246-869f871628b6
      github.com/example/a@v1.0.0 github.com/example/b@v2.0.0
      github.com/example/c@v1.0.0 github.com/example/a@v2.0.0
      github.com/example/c@v1.0.0 github.com/example/f@v0.0.0-20200121045136-8c9f03a8e57e
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app', undefined, {
      pruneRepeatedSubDependencies: false,
    });
    expect(depGraph.toJSON().graph.nodes).toMatchObject([
      {
        nodeId: 'root-node',
        pkgId: 'com.example/app@0.0.0',
        deps: [
          { nodeId: 'github.com/example/a@v2.0.0' },
          { nodeId: 'github.com/example/c@v1.0.0' },
          { nodeId: 'github.com/example/f@v0.0.0-20200121045136-8c9f03a8e57e' },
        ],
      },
      {
        nodeId: 'github.com/example/a@v2.0.0',
        pkgId: 'github.com/example/a@v2.0.0',
        deps: [],
      },
      {
        nodeId: 'github.com/example/c@v1.0.0',
        pkgId: 'github.com/example/c@v1.0.0',
        deps: [
          { nodeId: 'github.com/example/a@v2.0.0' },
          { nodeId: 'github.com/example/f@v0.0.0-20200121045136-8c9f03a8e57e' },
        ],
      },
      {
        nodeId: 'github.com/example/f@v0.0.0-20200121045136-8c9f03a8e57e',
        pkgId: 'github.com/example/f@v0.0.0-20200121045136-8c9f03a8e57e',
        deps: [],
      },
    ]);
  });

  it('prunes within top-level deps', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      com.example/app github.com/example/e@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/b@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/c@v1.0.0
      github.com/example/b@v1.0.0 github.com/example/d@v1.0.0
      github.com/example/c@v1.0.0 github.com/example/b@v1.0.0
      github.com/example/e@v1.0.0 github.com/example/b@v1.0.0
      github.com/example/e@v1.0.0 github.com/example/c@v1.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app');
    expect(depGraph.toJSON().graph.nodes).toMatchObject([
      {
        nodeId: 'root-node',
        pkgId: 'com.example/app@0.0.0',
        deps: [
          { nodeId: 'github.com/example/a@v1.0.0' },
          { nodeId: 'github.com/example/e@v1.0.0' },
        ],
      },
      {
        nodeId: 'github.com/example/a@v1.0.0',
        pkgId: 'github.com/example/a@v1.0.0',
        deps: [
          { nodeId: 'github.com/example/b@v1.0.0' },
          { nodeId: 'github.com/example/c@v1.0.0' },
        ],
      },
      {
        nodeId: 'github.com/example/b@v1.0.0',
        pkgId: 'github.com/example/b@v1.0.0',
        deps: [{ nodeId: 'github.com/example/d@v1.0.0' }],
      },
      {
        nodeId: 'github.com/example/d@v1.0.0',
        pkgId: 'github.com/example/d@v1.0.0',
        deps: [],
      },
      {
        nodeId: 'github.com/example/c@v1.0.0',
        pkgId: 'github.com/example/c@v1.0.0',
        deps: [{ nodeId: 'github.com/example/b@v1.0.0:pruned' }],
      },
      {
        nodeId: 'github.com/example/b@v1.0.0:pruned',
        pkgId: 'github.com/example/b@v1.0.0',
        info: { labels: { pruned: 'true' } },
        deps: [],
      },
      {
        nodeId: 'github.com/example/e@v1.0.0',
        pkgId: 'github.com/example/e@v1.0.0',
        deps: [
          { nodeId: 'github.com/example/b@v1.0.0' },
          { nodeId: 'github.com/example/c@v1.0.0' },
        ],
      },
    ]);
  });

  it('does not prune when disabled', () => {
    const input = format(`
      com.example/app github.com/example/a@v1.0.0
      com.example/app github.com/example/e@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/b@v1.0.0
      github.com/example/a@v1.0.0 github.com/example/c@v1.0.0
      github.com/example/b@v1.0.0 github.com/example/d@v1.0.0
      github.com/example/c@v1.0.0 github.com/example/b@v1.0.0
      github.com/example/e@v1.0.0 github.com/example/b@v1.0.0
      github.com/example/e@v1.0.0 github.com/example/c@v1.0.0
    `);
    const depGraph = parseGoModGraph(input, 'com.example/app', undefined, {
      pruneRepeatedSubDependencies: false,
    });
    expect(depGraph.toJSON().graph.nodes).toMatchObject([
      {
        nodeId: 'root-node',
        pkgId: 'com.example/app@0.0.0',
        deps: [
          { nodeId: 'github.com/example/a@v1.0.0' },
          { nodeId: 'github.com/example/e@v1.0.0' },
        ],
      },
      {
        nodeId: 'github.com/example/a@v1.0.0',
        pkgId: 'github.com/example/a@v1.0.0',
        deps: [
          { nodeId: 'github.com/example/b@v1.0.0' },
          { nodeId: 'github.com/example/c@v1.0.0' },
        ],
      },
      {
        nodeId: 'github.com/example/b@v1.0.0',
        pkgId: 'github.com/example/b@v1.0.0',
        deps: [{ nodeId: 'github.com/example/d@v1.0.0' }],
      },
      {
        nodeId: 'github.com/example/d@v1.0.0',
        pkgId: 'github.com/example/d@v1.0.0',
        deps: [],
      },
      {
        nodeId: 'github.com/example/c@v1.0.0',
        pkgId: 'github.com/example/c@v1.0.0',
        deps: [{ nodeId: 'github.com/example/b@v1.0.0' }],
      },
      {
        nodeId: 'github.com/example/e@v1.0.0',
        pkgId: 'github.com/example/e@v1.0.0',
        deps: [
          { nodeId: 'github.com/example/b@v1.0.0' },
          { nodeId: 'github.com/example/c@v1.0.0' },
        ],
      },
    ]);
  });
});

describe('examples', () => {
  it.each(['empty', 'simple', 'semver-prefixed'])(
    'example: %s',
    async (example: string) => {
      const input = load('gomod', example, 'gomodgraph');
      const expectedGraph = createFromJSON(
        JSON.parse(load('gomod', example, 'expected-graph.json')),
      );
      const depGraph = parseGoModGraph(input);
      try {
        expect(depGraph.equals(expectedGraph, { compareRoot: true })).toBe(
          true,
        );
      } catch (e) {
        expect(depGraph.toJSON()).toEqual(expectedGraph.toJSON());
      }
    },
  );
});
