import fs from 'fs';
import path from 'path';
import { distToMap, restoreFsMethods } from './utils';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures/prebundle');

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
  test(`prebundle: ${name}`, async () => {
    // execute build
    await cli.run({
      args: { _: ['prebundle'], $0: 'node' },
      cwd: path.join(CASES_DIR, name),
    });

    // prepare file map
    const fileMap = distToMap(path.join(CASES_DIR, name, 'compiled'));

    // check result
    require(`${CASES_DIR}/${name}/expect`).default(fileMap);
  });
}
