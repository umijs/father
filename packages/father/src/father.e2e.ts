import { join } from 'path';
import { fork } from 'child_process';
import { existsSync } from 'fs';

const binPath = join(__dirname, '../bin/father.js');

function assertDocz(cwd) {
  const absDirPath = join(cwd, '.doc');
  expect(existsSync(join(absDirPath))).toEqual(true);
  expect(existsSync(join(absDirPath, 'index.html'))).toEqual(true);
  expect(existsSync(join(absDirPath, 'assets.json'))).toEqual(true);
}

describe('father doc build', () => {
  process.env.COMPRESS = 'none';
  process.env.IS_TEST = 'true';

  jest.setTimeout(60000);

  require('test-build-result')({
    root: join(__dirname, './fixtures/e2e'),
    build({ cwd }) {
      return new Promise(resolve => {
        const child = fork(binPath, ['doc', 'build'], {
          cwd,
          env: process.env,
        });
        child.on('exit', code => {
          expect(code).toEqual(0);
          const child = fork(binPath, ['build', '--esm'], {
            cwd,
            env: process.env,
          });
          child.on('exit', code => {
            expect(code).toEqual(0);
            assertDocz(cwd);
            resolve();
          });
        });
      });
    },
  });
});
