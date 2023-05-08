import path from 'path';
import * as cli from '../src/cli/cli';
import { distToMap, getDirCases } from './utils';

const CASES_DIR = path.join(__dirname, 'fixtures/build');

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
});

afterAll(() => {
  delete process.env.APP_ROOT;
  delete process.env.FATHER_CACHE;
});

// generate cases
const cases = getDirCases(CASES_DIR);

for (let name of cases) {
  it(`build: ${name}`, async () => {
    // execute build
    process.env.APP_ROOT = path.join(CASES_DIR, name);
    await cli.run({
      args: { _: ['build'], $0: 'node' },
    });

    // prepare file map
    const fileMap = distToMap(path.join(CASES_DIR, name, 'dist'));

    // check result
    (await import(`${CASES_DIR}/${name}/expect`)).default(fileMap);
  });
}
