import fs from 'fs';
import path from 'path';
import { distToMap, restoreFsMethods } from './utils';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures/build');

// workaround for a wired issue in fs
afterEach(() => {
  restoreFsMethods();
});

// generate cases
const cases = fs
  .readdirSync(CASES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  .map((d) => d.name);

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
