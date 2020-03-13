const { existsSync, writeFileSync } = require('fs');
const { join } = require('path');
const { yParser } = require('@umijs/utils');
const getPackages = require('./utils/getPackages');

(async () => {
  const args = yParser(process.argv);
  const version = require('../lerna.json').version;

  const pkgs = getPackages();

  pkgs.forEach(shortName => {
    const name = shortName === 'father' ? shortName : `father-${shortName}`;

    const pkgJSONPath = join(
      __dirname,
      '..',
      'packages',
      shortName,
      'package.json',
    );
    const pkgJSONExists = existsSync(pkgJSONPath);
    if (args.force || !pkgJSONExists) {
      const json = {
        name,
        version,
        description: name,
        main: 'lib/index.js',
        types: 'lib/index.d.ts',
        files: ['lib', 'src'],
        repository: {
          type: 'git',
          url: 'https://github.com/umijs/father',
        },
        keywords: ['father', 'bundler', 'component', 'rollup'],
        authors: ['chencheng <sorrycc@gmail.com> (https://github.com/sorrycc)'],
        license: 'MIT',
        bugs: 'http://github.com/umijs/father/issues',
        homepage: `https://github.com/umijs/father/tree/master/packages/${shortName}#readme`,
        publishConfig: {
          access: 'public',
        },
      };
      if (pkgJSONExists) {
        const pkg = require(pkgJSONPath);
        [
          'dependencies',
          'devDependencies',
          'peerDependencies',
          'bin',
          'files',
          'authors',
          'types',
          'sideEffects',
          'main',
          'module',
        ].forEach(key => {
          if (pkg[key]) json[key] = pkg[key];
        });
      }
      writeFileSync(pkgJSONPath, `${JSON.stringify(json, null, 2)}\n`);
    }

    if (shortName !== 'father') {
      const readmePath = join(
        __dirname,
        '..',
        'packages',
        shortName,
        'README.md',
      );
      if (args.force || !existsSync(readmePath)) {
        writeFileSync(readmePath, `# ${name}\n`);
      }
    }
  });
})();
