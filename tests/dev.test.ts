import fs from 'fs';
import path from 'path';
import * as cli from '../src/cli/cli';
import { WATCH_DEBOUNCE_STEP } from '../src/constants';
import { distToMap } from './utils';

const CASE_DIR = path.join(__dirname, 'fixtures/dev');
const CASE_SRC = path.join(CASE_DIR, 'src');
const CASE_DIST = path.join(CASE_DIR, 'dist');
const CASE_CONFIG = path.join(CASE_DIR, '.fatherrc.ts');
const CASE_CONFIG_CONTENT = fs.readFileSync(CASE_CONFIG, 'utf-8');

// create wait util via real setTimeout
const wait = (
  (s) => (t: number) =>
    new Promise<void>((r) => s(r, t))
)(setTimeout);

// use global for mock scope
global.TMP_WATCHERS = [];
global.TMP_CASE_CONFIG = CASE_CONFIG;

jest.mock('../src/builder/bundle/index.ts', () => {
  const originalModule = jest.requireActual('../src/builder/bundle/index.ts');

  return {
    __esModule: true,
    ...originalModule,
    // mock bundle for save watcher
    default: async (args: any) => {
      const watcher = await originalModule.default(args);
      global.TMP_WATCHERS.push(watcher);
      return watcher;
    },
  };
});

jest.mock('@umijs/utils', () => {
  const originalModule = jest.requireActual('@umijs/utils');

  return {
    __esModule: true,
    ...originalModule,
    // save watchers for close dev
    // ref: https://jestjs.io/docs/mock-functions#mocking-partials
    chokidar: {
      ...originalModule.chokidar,
      watch: (...args: any) => {
        const ret = originalModule.chokidar.watch(...args);

        global.TMP_WATCHERS.push(ret);

        return ret;
      },
    },

    // workaround for watch config file change in jest
    // ref:
    //  - https://github.com/facebook/jest/issues/6034
    //  - https://github.com/umijs/umi-next/blob/e46748deab90807c8504dfe11f3bb554f4f27ac3/packages/core/src/config/config.ts#L172
    // TODO: remove this when umi ready
    register: {
      ...originalModule.register,
      getFiles: () => [global.TMP_CASE_CONFIG],
    },
  };
});

// workaround to fix require cache in jest
// to make sure father load the latest config
jest.mock('./fixtures/dev/.fatherrc.ts', () => {
  const originalModule = jest.requireActual(global.TMP_CASE_CONFIG);

  if (global.TMP_TRANSFORMER) {
    originalModule.default.esm.transformer = global.TMP_TRANSFORMER;
  }

  return {
    __esModule: true,
    default: originalModule.default,
  };
});

beforeAll(async () => {
  fs.rmSync(path.join(CASE_SRC, 'child'), { recursive: true, force: true });

  // execute dev
  process.env.APP_ROOT = path.join(CASE_DIR);
  process.env.COMPRESS = 'none';
  await cli.run({
    args: { _: ['dev'], $0: 'node' },
  });

  // await chokidar ready
  await wait(100);
});

afterAll(async () => {
  // close watchers
  await Promise.all(global.TMP_WATCHERS.map((watcher) => watcher.close()));
  delete global.TMP_WATCHERS;
  delete global.TMP_CASE_CONFIG;
  delete global.TMP_TRANSFORMER;
  delete process.env.APP_ROOT;
  delete process.env.COMPRESS;

  // restore file content
  fs.writeFileSync(path.join(CASE_SRC, 'index.ts'), '', 'utf-8');

  // restore config
  fs.writeFileSync(CASE_CONFIG, CASE_CONFIG_CONTENT, 'utf-8');

  jest.unmock('@umijs/utils');
  jest.unmock('./fixtures/dev/.fatherrc.ts');
  jest.unmock('../src/builder/bundle/index.ts');
});

test('dev: file output', () => {
  const fileMap = distToMap(CASE_DIST);

  expect(fileMap['esm/index.js']).not.toBeUndefined();
  expect(fileMap['esm/index.d.ts']).not.toBeUndefined();

  // expect generate d.ts.map in development mode by default
  expect(fileMap['esm/index.d.ts.map']).not.toBeUndefined();

  // expect umd file
  expect(fileMap['umd/index.min.js']).not.toBeUndefined();
});

test('dev: file change', async () => {
  const content = `a = 1`;

  // make file change
  fs.writeFileSync(
    path.join(CASE_SRC, 'index.ts'),
    `export const ${content};`,
    'utf-8',
  );

  await Promise.all([
    // wait for watch debounce and compile
    wait(WATCH_DEBOUNCE_STEP + 500),
    // wait for webpack compilation done
    new Promise<void>((resolve) => {
      const logSpy = jest.spyOn(console, 'log');
      const handler = () => {
        try {
          expect(console.log).toHaveBeenCalledWith(
            // badge
            expect.stringContaining('-'),
            // time
            expect.stringContaining('['),
            // content
            expect.stringContaining('Bundle '),
          );
          logSpy.mockRestore();
          resolve();
        } catch {
          setTimeout(handler, 500);
        }
      };

      handler();
    }),
  ]);

  const fileMap = distToMap(CASE_DIST);

  expect(fileMap['esm/index.js']).toContain(content);
  expect(fileMap['umd/index.min.js']).toContain(content);
});

test('dev: file add', async () => {
  fs.mkdirSync(path.join(CASE_SRC, 'child'));
  fs.writeFileSync(path.join(CASE_SRC, 'child/new.ts'), '', 'utf-8');

  // wait for watch debounce and compile
  await wait(WATCH_DEBOUNCE_STEP + 500);

  const fileMap = distToMap(CASE_DIST);

  expect(fileMap[`esm/child/new.js`]).not.toBeUndefined();
  expect(fileMap['esm/child/new.d.ts']).not.toBeUndefined();
});

test('dev: file delete', async () => {
  fs.rmSync(path.join(CASE_SRC, 'child'), { recursive: true });

  // wait for watch debounce and compile
  await wait(WATCH_DEBOUNCE_STEP + 500);

  const fileMap = distToMap(CASE_DIST);

  expect(fileMap[`esm/child/new.js`]).toBeUndefined();
  expect(fileMap['esm/child/new.d.ts']).toBeUndefined();

  // expect directory also be removed
  expect(fs.existsSync(path.join(CASE_DIST, 'child'))).toBe(false);
});

test('dev: config change', async () => {
  global.TMP_TRANSFORMER = 'esbuild';
  jest.resetModules();
  fs.writeFileSync(
    CASE_CONFIG,
    CASE_CONFIG_CONTENT.replace('babel', 'esbuild'),
    'utf-8',
  );

  // wait for restart (at least 5s+ is required to restart in Windows CI)
  await wait(6000);

  const fileMap = distToMap(CASE_DIST);

  // expect comment be generated by esbuild
  expect(fileMap[`esm/index.js`]).toContain('// src/index.ts');
});
