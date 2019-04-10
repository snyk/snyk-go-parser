const test = require('tap').test;
import * as path from 'path';

import * as subProcess from '../../lib/sub-process';
import { buildDepTreeFromFiles } from '../../lib';

// TODO(kyegupov): convert to Jest

test('happy inspect', (t) => {
  chdirToPkg(['path', 'to', 'pkg']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/pkg',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('pkg with local import', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-local-import']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('dependencies', (t) => {
        t.match(pkg, {
          version: '',
          dependencies: {
            'gitpub.com/meal/dinner': {
              version: 'v0.0.7',
              dependencies: {
                'gitpub.com/food/salad': {
                  version: 'v1.3.7',
                  dependencies: {
                    'gitpub.com/nature/vegetables/tomato': {
                      version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                    },
                  },
                },
              },
            },
          },
        }, 'local subpkg merged with root');

        t.end();
      });
    });
});

test('pkg with internal subpkg', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-internal-subpkg']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('dependencies', (t) => {
        t.match(pkg, {
          version: '',
          dependencies: {
            'gitpub.com/meal/dinner': {
              version: 'v0.0.7',
              dependencies: {
                'gitpub.com/food/salad': {
                  version: 'v1.3.7',
                  dependencies: {
                    'gitpub.com/nature/vegetables/tomato': {
                      version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                    },
                  },
                },
              },
            },
          },
        }, 'internal subpkgps are not in tree, but their children are');

        t.end();
      });
    });
});

test('multi-root project', (t) => {
  chdirToPkg(['path', 'to', 'multiroot-pkg']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/multiroot-pkg',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        console.log('222');
        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');
        console.log('ennnd');
        t.end();
        console.log('????');
      });

    }).then(function () {
      const goResolveTool =
        path.join(__dirname, '..', '..', 'gosrc', 'resolve-deps.go');
      console.log(111);
      return subProcess.execute('go', [
        'run',
        goResolveTool,
        '-list',
        '-ignoredPkgs=path/to/multiroot-pkg/shouldskip/ignored_pkg,' +
          'path/to/multiroot-pkg/shouldskip/ignored_pkg_wildcard/*',
      ]).then((result) => {
        console.log('www');
        t.test('resolved deps', (t) => {
          const list = JSON.parse(result);
          t.same(list.sort(), [
            '.',
            'gitpub.com/food/salad',
            'gitpub.com/meal/dinner',
            'gitpub.com/nature/vegetables/cucamba',
            'gitpub.com/nature/vegetables/tomato',
            'path/to/multiroot-pkg',
            'path/to/multiroot-pkg/cmd/tool',
            'path/to/multiroot-pkg/lib',
            'path/to/multiroot-pkg/should-ignore-deps/only_test_files',
          ].sort(), 'list of resolved deps as expected');
          t.end();
        });
      }).catch(t.threw);
    });
});

test('multi-root project without code at root', (t) => {
  chdirToPkg(['path', 'to', 'multiroot-pkg-without-root']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/multiroot-pkg-without-root',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.match(deps['gitpub.com/meal/dinner/desert'], {
          version: 'v0.0.7',
          dependencies: {},
        }, 'dinner/desert is a direct dependency');

        t.end();
      });

    }).then(function () {
      const goResolveTool =
        path.join(__dirname, '..', '..', 'gosrc', 'resolve-deps.go');
      return subProcess.execute('go', [
        'run',
        goResolveTool,
        '-list',
      ]).then((result) => {
        t.test('resolved deps', (t) => {
          const list = JSON.parse(result);
          t.same(list.sort(), [
            '.',
            'gitpub.com/food/salad',
            'gitpub.com/meal/dinner',
            'gitpub.com/meal/dinner/desert',
            'gitpub.com/nature/vegetables/cucamba',
            'gitpub.com/nature/vegetables/tomato',
            'path/to/multiroot-pkg-without-root/cmd/tool',
            'path/to/multiroot-pkg-without-root/cmd/util',
            'path/to/multiroot-pkg-without-root/lib',
          ].sort(), 'list of resolved deps as expected');
          t.end();
        });
      });
    });
});

test('no Go code', (t) => {
  chdirToPkg(['path', 'to', 'empty']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.same(pkg, {
          name: 'path/to/empty',
          dependencies: {},
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });
    }
    );
});

test('with external ignores', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-ignores']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/pkg-with-ignores',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'depends on tomato and cucamba, even though vegetables are ignored');


        t.type(
          deps['gitpub.com/nature/vegetables'], 'undefined',
          'vegetables pkg is ignored');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('with external ignores (govendor)', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-ignores-govendor']);

  return buildDepTreeFromFiles('.', '[ignored]', 'vendor/vendor.json')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/pkg-with-ignores-govendor',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;
        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
        }, 'salad is a dep');

        const saladDeps = deps['gitpub.com/food/salad'].dependencies!;
        t.type(
          deps['gitpub.com/nature/vegetables'], 'undefined',
          'vegetables pkg is ignored');
        t.type(
          saladDeps['gitpub.com/nature/vegetables/tomato'], 'undefined',
          'tomato is ignored');
        t.type(
          saladDeps['gitpub.com/nature/vegetables/cucamba'], 'undefined',
          'tomato is ignored');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});


test('missing vendor/ folder', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-missing-vendor-folder']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch((error) => {
      t.equal(
        error.message,
        'Unresolved packages:\n' +
        ' -  gitpub.com/food/salad\n' +
        ' -  gitpub.com/meal/dinner\n' +
        '\nUnresolved imports found, please run `dep ensure`');
    });
});

test('missing some packages in vendor/ folder (dep)', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-partial-vendor-folder']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch((error) => {
      t.equal(
        error.message,
        'Unresolved packages:\n' +
        ' -  gitpub.com/nature/vegetables/cucamba\n' +
        ' -  gitpub.com/nature/vegetables/tomato\n' +
        '\nUnresolved imports found, please run `dep ensure`');
    });
});

test('missing some packages in vendor/ folder (govendor)', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-partial-vendor-folder']);

  return buildDepTreeFromFiles('.', '[ignored]', 'vendor/vendor.json')
    .then(function () {
      t.fail('should have failed');
    }).catch((error) => {
      t.equal(
        error.message,
        'Unresolved packages:\n' +
        ' -  gitpub.com/nature/vegetables/cucamba\n' +
        ' -  gitpub.com/nature/vegetables/tomato\n' +
        '\nUnresolved imports found, please run `govendor sync`');
    });
});

test('cyclic import', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-cycle']);

  return buildDepTreeFromFiles('.', '[ignored]', 'vendor/vendor.json')
    .then(function () {
      t.fail('should have failed');
    }).catch((error) => {
      t.match(error.message, 'import cycle');
      t.pass();
    });
});

test('corrupt Gopkg.lock', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-corrupt-gopkg-lock']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('corrupt Gopkg.toml', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-corrupt-gopkg-toml']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('missing Gopkg.toml', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-missing-gopkg-toml']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('GOPATH not defined', (t) => {
  chdirToPkg(['path', 'to', 'pkg']);
  delete process.env['GOPATH'];

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

test('pkg without external deps', (t) => {
  chdirToPkg(['path', 'to', 'pkg-without-deps']);

  return buildDepTreeFromFiles('.', '[ignored]', 'Gopkg.lock')
    .then((pkg) => {

      t.test('pkg', (t) => {
        t.same(pkg, {
          name: 'path/to/pkg-without-deps',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
          dependencies: {},
        });
        t.end();
      });
    });
});

test('happy inspect govendor', (t) => {
  chdirToPkg(['path', 'to', 'pkg']);

  return buildDepTreeFromFiles('.', '[ignored]', 'vendor/vendor.json')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/pkg',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('inspect govendor with alternate case', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-alternate-govendor']);

  return buildDepTreeFromFiles('.', '[ignored]', 'vendor/vendor.json')
    .then((pkg) => {

      t.test('root pkg', (t) => {
        t.match(pkg, {
          name: 'path/to/pkg-with-alternate-govendor',
          version: '',
          packageFormatVersion: 'golang:0.0.1',
          dependencies: {
            'gitpub.com/drink/juice': {
              version: '#23b2ba882803c3f509a94d5e79f61924126100cf',
            },
          },
        }, 'root pkg');
        t.end();
      });

      t.test('dependencies', (t) => {
        const deps = pkg.dependencies!;

        t.match(deps['gitpub.com/food/salad'], {
          name: 'gitpub.com/food/salad',
          version: 'v1.3.7',
          dependencies: {
            'gitpub.com/nature/vegetables/tomato': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
            'gitpub.com/nature/vegetables/cucamba': {
              version: '#b6ffb7d62206806b573348160795ea16a00940a6',
            },
          },
        }, 'salad depends on tomato and cucamba');

        t.match(deps['gitpub.com/meal/dinner'], {
          version: 'v0.0.7',
          dependencies: {
            'gitpub.com/food/salad': {
              version: 'v1.3.7',
              dependencies: {
                'gitpub.com/nature/vegetables/tomato': {
                  version: '#b6ffb7d62206806b573348160795ea16a00940a6',
                },
              },
            },
          },
        }, 'salad is also a trasitive dependency');

        t.end();
      });
    });
});

test('corrupt vendor.json', (t) => {
  chdirToPkg(['path', 'to', 'pkg-with-corrupt-govendor-json']);

  return buildDepTreeFromFiles('.', '[ignored]', 'vendor/vendor.json')
    .then(function () {
      t.fail('should have failed');
    }).catch(function () {
      t.pass();
    });
});

function chdirToPkg(pkgPathArray) {
  process.env['GOPATH'] = path.resolve(__dirname, 'fixtures', 'gopath');
  process.chdir(
    // use apply() instead of the spread `...` operator to support node v4
    path.resolve.apply(
      null,
      [__dirname, 'fixtures', 'gopath', 'src'].concat(pkgPathArray)
    )
  );
}
