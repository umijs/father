import path from 'path';
import { distToMap, getDirCases } from './utils';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures/build');

afterAll(() => {
  delete process.env.APP_ROOT;
});

// generate cases
const cases = getDirCases(CASES_DIR);

for (let name of cases) {
  test(`build: ${name}`, async () => {
    // execute build
    process.env.APP_ROOT = path.join(CASES_DIR, name);
    await cli.run({
      args: { _: ['build'], $0: 'node' },
    });

    // prepare file map
    const fileMap = distToMap(path.join(CASES_DIR, name, 'dist'));

    // check result
    require(`${CASES_DIR}/${name}/expect`).default(fileMap);
  });
}
