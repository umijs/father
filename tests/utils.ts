import { resolve, winPath } from '@umijs/utils';
import fs from 'fs';
import path from 'path';

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

let moduleCache = {};
/**
 * Substitutes all imported modules from provided path with another module.
 * why? vi.mock works only for modules that were imported with the import keyword. It doesn't work with require.
 * @param modulePath
 * @param mockExports
 * @returns
 */
export function mockModule(modulePath, mockExports) {
  const module = require.resolve(modulePath);
  const originalModule = require.cache[module];
  moduleCache[module] = originalModule;
  const mockModule = {
    ...originalModule,
    exports: {},
    mockReset: () => {
      require.cache[module] = moduleCache[module];
    },
  };
  Object.keys(mockExports).forEach((key) => {
    mockModule.exports[key] = mockExports[key];
  });

  // @ts-ignore
  require.cache[require.resolve(modulePath)] = mockModule;

  return mockModule.exports;
}

export function unMockModule(modulePath) {
  require.cache[require.resolve(modulePath)] =
    moduleCache[require.resolve(modulePath)];
}

export function resetAllMockModules() {
  Object.keys(moduleCache).forEach((key) => {
    require.cache[key] = moduleCache[key];
  });
}

export const requireResolve = (path: string) => {
  return resolve.sync(path, {
    basedir: __dirname,
    extensions: ['.ts', '.js'],
  });
};
