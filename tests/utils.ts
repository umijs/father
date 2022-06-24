import fs from 'fs';
import path from 'path';
import { winPath } from '@umijs/utils';

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

/**
 * get cases from fixture directory
 */
export function getDirCases(dirPath: string) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name);
}
