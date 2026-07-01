import fs from 'fs';
import { mockProcessExit } from 'jest-mock-process';
import os from 'os';
import path from 'path';
import { resolveTsgoBin } from '../src/builder/bundless/dts';
import * as cli from '../src/cli/cli';
import { distToMap } from './utils';

const CASE_DIR = path.join(__dirname, 'fixtures/tsgo-dts');
const mockExit = mockProcessExit();
const tmpDirs: string[] = [];
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
  tmpDirs.forEach((dir) => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  mockExit.mockRestore();
});

function createNativePreviewFixture(
  pkgJson: Record<string, any>,
  binPath: string,
  extraFiles: string[] = [],
) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'father-tsgo-'));
  tmpDirs.push(cwd);

  const pkgDir = path.join(
    cwd,
    'node_modules',
    '@typescript',
    'native-preview',
  );
  const fullBinPath = path.join(pkgDir, binPath);
  fs.mkdirSync(path.dirname(fullBinPath), { recursive: true });
  extraFiles.forEach((file) => {
    fs.mkdirSync(path.dirname(path.join(pkgDir, file)), { recursive: true });
    fs.writeFileSync(path.join(pkgDir, file), '#!/usr/bin/env node\n');
  });
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: '@typescript/native-preview', ...pkgJson }),
  );
  fs.writeFileSync(fullBinPath, '#!/usr/bin/env node\n');

  return { cwd, binPath };
}

test('resolve tsgo bin from package bin field with file extension', () => {
  const fixture = createNativePreviewFixture(
    { bin: { tsgo: 'bin/tsgo.js' } },
    'bin/tsgo.js',
  );

  const resolvedBin = resolveTsgoBin(fixture.cwd);

  expect(fs.existsSync(resolvedBin)).toBe(true);
  expect(
    path.normalize(resolvedBin).endsWith(path.normalize(fixture.binPath)),
  ).toBe(true);
});

test('resolve tsgo js entry when package bin field is extensionless', () => {
  const fixture = createNativePreviewFixture(
    { bin: { tsgo: 'bin/tsgo' } },
    'bin/tsgo',
    ['lib/tsgo.js'],
  );

  const resolvedBin = resolveTsgoBin(fixture.cwd);

  expect(fs.existsSync(resolvedBin)).toBe(true);
  expect(
    path.normalize(resolvedBin).endsWith(path.normalize('lib/tsgo.js')),
  ).toBe(true);
});

test('resolve legacy tsgo.js bin when package bin field is unavailable', () => {
  const fixture = createNativePreviewFixture({}, 'bin/tsgo.js');

  const resolvedBin = resolveTsgoBin(fixture.cwd);

  expect(fs.existsSync(resolvedBin)).toBe(true);
  expect(
    path.normalize(resolvedBin).endsWith(path.normalize(fixture.binPath)),
  ).toBe(true);
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
