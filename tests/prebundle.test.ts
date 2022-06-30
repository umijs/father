import fs from 'fs';
import path from 'path';
import * as cli from '../src/cli/cli';
import { distToMap, getDirCases } from './utils';

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

    const outputDir = name === 'output' ? 'modules' : 'compiled';
    // prepare file map
    const fileMap = distToMap(path.join(CASES_DIR, name, outputDir));

    // check result
    require(`${CASES_DIR}/${name}/expect`).default(fileMap);
  });
}
