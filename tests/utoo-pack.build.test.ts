import { difference } from '@umijs/utils/compiled/lodash';
import os from 'os';
import path from 'path';
import * as cli from '../src/cli/cli';
import { distToMap, getDirCases } from './utils';

global.CASES_DIR = path.join(__dirname, 'fixtures/build');
const isWindows = os.platform() === 'win32';
const isLinux = os.platform() === 'linux';

const UTOO_PACK_NOT_SUPORTED_CASES = [
  'bundle-babel-config',
  'bundle-chain-webpack',
  'styled-components',
  'bundle-externals',
  'bundle-platform-node',
  'bundle-theme',
];

const setupRcFileMocks = (cases, casesDir) => {
  cases.forEach((name) => {
    const rcFilePath = path.join(casesDir, name, '.fatherrc.ts');
    jest.doMock(rcFilePath, () => {
      const originalModule = jest.requireActual(rcFilePath);
      originalModule.default.umd &&
        (originalModule.default.umd = {
          name: 'utoo_build_test',
          ...originalModule.default.umd,
          bundler: 'utoopack',
          rootPath: path.resolve(__dirname, '../'),
        });
      return {
        __esModule: true,
        default: originalModule.default,
      };
    });
  });
};

const uninstallRcFileMocks = (cases, casesDir) => {
  cases.forEach((name) => {
    const rcFilePath = path.join(casesDir, name, '.fatherrc.ts');
    jest.unmock(rcFilePath);
  });
};

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
  setupRcFileMocks(cases, global.CASES_DIR);
});

afterAll(() => {
  uninstallRcFileMocks(cases, global.CASES_DIR);
  delete process.env.APP_ROOT;
  delete process.env.FATHER_CACHE;
});

// generate cases
const cases = difference(
  getDirCases(global.CASES_DIR),
  UTOO_PACK_NOT_SUPORTED_CASES,
) as string[];
if (!isWindows || !isLinux) {
  for (let name of cases) {
    test(`utoopack build: ${name}`, async () => {
      // execute build
      process.env.APP_ROOT = path.join(global.CASES_DIR, name);
      await cli.run({
        args: { _: ['build'], $0: 'node' },
      });

      // prepare file map
      const fileMap = distToMap(path.join(global.CASES_DIR, name, 'dist'));

      // check result
      require(`${global.CASES_DIR}/${name}/expect`).default(fileMap);
    });
  }
} else {
  test.skip('utoopack test cases should be skipped on Windows', () => {});
}
