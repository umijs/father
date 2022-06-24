import fs from 'fs';
import path from 'path';
import { distToMap, getDirCases } from './utils';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures/prebundle');

// save original methods of fs
const oFs = Object.keys(fs).reduce((r, k) => {
  r[k] = fs[k];

  return r;
}, {});

beforeAll(() => {
  jest.resetModules();
});

// workaround for a wired issue in fs
// ncc will hack a part method of fs and it will cause test error
afterEach(() => {
  Object.keys(oFs).forEach((k) => {
    if (oFs[k] !== fs[k]) fs[k] = oFs[k];
  });

  delete process.env.APP_ROOT;
});

// generate cases
const cases = getDirCases(CASES_DIR);

for (let name of cases) {
  test(`prebundle: ${name}`, async () => {
    // execute prebundle
    process.env.APP_ROOT = path.join(CASES_DIR, name);
    await cli.run({
      args: { _: ['prebundle'], $0: 'node' },
    });

    // prepare file map
    const fileMap = distToMap(path.join(CASES_DIR, name, 'compiled'));

    // check result
    require(`${CASES_DIR}/${name}/expect`).default(fileMap);
  });
}
