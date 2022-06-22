import fs from 'fs';
import path from 'path';
import { winPath } from '@umijs/utils';

// save original methods of fs
const oFs = Object.keys(fs).reduce((r, k) => {
  r[k] = fs[k];
  return r;
}, {});

/**
 * workaround for a wired issue in fs
 * some unknown logics hack a part method of fs and it will cause test error
 */
export function restoreFsMethods() {
  Object.keys(oFs).forEach((k) => {
    if (oFs[k] !== fs[k]) fs[k] = oFs[k];
  });
}

/**
 * read dist directory to file map
 */
export function distToMap(
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
