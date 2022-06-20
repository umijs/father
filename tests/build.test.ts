import fs from 'fs';
import path from 'path';
import { winPath } from '@umijs/utils';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures');

/**
 * read dist directory to file map
 */
function distToMap(
  distPath: string,
  parentPath = '',
  fileMap: Record<string, string> = {},
) {
  fs.readdirSync(distPath, { withFileTypes: true }).forEach((item) => {
    if (item.isFile()) {
      fileMap[winPath(path.join(parentPath, item.name))] = fs.readFileSync(
        path.join(distPath, item.name),
        'utf-8',
      );
    } else if (item.isDirectory()) {
      distToMap(
        path.join(distPath, item.name),
        path.join(parentPath, item.name),
        fileMap,
      );
    }
  });

  return fileMap;
}

// workaround for a wired issue in fs
// some logic hack a part method of fs and it will cause test error
const oFs = Object.keys(fs).reduce((r, k) => {
  r[k] = fs[k];
  return r;
}, {});

afterEach(() => {
  Object.keys(oFs).forEach((k) => {
    if (oFs[k] !== fs[k]) fs[k] = oFs[k];
  });
});

// generate cases
const cases = fs
  .readdirSync(CASES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
  .map((d) => d.name);

for (let name of cases) {
  test(`build: ${name}`, async () => {
    // execute build
    await cli.run({
      args: { _: ['build'], $0: 'node' },
      cwd: path.join(CASES_DIR, name),
    });

    // prepare file map
    const fileMap = distToMap(path.join(CASES_DIR, name, 'dist'));

    // check result
    require(`${CASES_DIR}/${name}/expect`).default(fileMap);
  });
}
