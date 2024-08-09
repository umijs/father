import path from 'path';
import * as cli from '../dist/cli/cli';
import { distToMap, getDirCases } from './utils';

global.CASES_DIR = path.join(__dirname, 'fixtures/build');

const setupRcFileMocks = (cases, casesDir) => {
  cases.forEach((name) => {
    const rcFilePath = path.join(casesDir, name, '.fatherrc.ts');
    jest.doMock(rcFilePath, () => {
      const originalModule = jest.requireActual(rcFilePath);
      console.log(originalModule.default, 'originalModule');
      originalModule.default.esm &&
        (originalModule.default.esm = {
          ...originalModule.default.esm,
          parallel: true,
        });
      originalModule.default.cjs &&
        (originalModule.default.cjs = {
          ...originalModule.default.cjs,
          parallel: true,
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
const cases = getDirCases(global.CASES_DIR).filter((item) =>
  item.includes('bundless'),
);

for (let name of cases) {
  test(`parllel build: ${name}`, async () => {
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
