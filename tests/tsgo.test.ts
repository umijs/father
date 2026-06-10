import { mockProcessExit } from 'jest-mock-process';
import path from 'path';
import * as cli from '../src/cli/cli';
import { distToMap } from './utils';

const CASE_DIR = path.join(__dirname, 'fixtures/tsgo-dts');
const mockExit = mockProcessExit();
const hasTsgo = (() => {
  try {
    require.resolve('@typescript/native-preview/package.json', {
      paths: [CASE_DIR],
    });
    return true;
  } catch {
    return false;
  }
})();

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
});

afterAll(() => {
  delete process.env.APP_ROOT;
  delete process.env.FATHER_CACHE;
  mockExit.mockRestore();
});

(hasTsgo ? test : test.skip)('build: bundless tsgo dts', async () => {
  process.env.APP_ROOT = CASE_DIR;
  await cli.run({
    args: { _: ['build'], $0: 'node' },
  });

  const fileMap = distToMap(path.join(CASE_DIR, 'dist'));

  expect(fileMap['esm/index.d.ts']).toContain('./value');
  expect(fileMap['esm/value.d.ts']).toContain(
    'export declare const value = "tsgo"',
  );
});
