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
const hasNativeTypeScript = (() => {
  for (const packageName of [
    'typescript',
    '@typescript/native',
    '@typescript/native-preview',
  ]) {
    try {
      const pkgPath = require.resolve(`${packageName}/package.json`, {
        paths: [CASE_DIR],
      });
      const pkg = fs.readFileSync(pkgPath, 'utf-8');
      if (
        packageName !== '@typescript/native-preview' &&
        Number(JSON.parse(pkg).version.split('.')[0]) < 7
      ) {
        continue;
      }
      return true;
    } catch {}
  }

  return false;
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

function createCompilerFixture(
  packageName: string,
  pkgJson: Record<string, any>,
  binPath: string,
  extraFiles: string[] = [],
  fixtureCwd?: string,
) {
  const cwd =
    fixtureCwd || fs.mkdtempSync(path.join(os.tmpdir(), 'father-tsgo-'));
  if (!fixtureCwd) {
    tmpDirs.push(cwd);
  }

  const pkgDir = path.join(cwd, 'node_modules', ...packageName.split('/'));
  const fullBinPath = path.join(pkgDir, binPath);
  fs.mkdirSync(path.dirname(fullBinPath), { recursive: true });
  extraFiles.forEach((file) => {
    fs.mkdirSync(path.dirname(path.join(pkgDir, file)), { recursive: true });
    fs.writeFileSync(path.join(pkgDir, file), '#!/usr/bin/env node\n');
  });
  fs.writeFileSync(
    path.join(pkgDir, 'package.json'),
    JSON.stringify({ name: packageName, ...pkgJson }),
  );
  fs.writeFileSync(fullBinPath, '#!/usr/bin/env node\n');

  return { cwd, binPath };
}

function createLegacyNativeAliasFixture(cwd: string) {
  createCompilerFixture(
    '@typescript/native',
    { name: 'typescript', version: '6.0.3', bin: { tsc: 'bin/tsc' } },
    'bin/tsc',
    [],
    cwd,
  );
}

function createNativePreviewFixture(
  pkgJson: Record<string, any>,
  binPath: string,
  extraFiles: string[] = [],
) {
  const fixture = createCompilerFixture(
    '@typescript/native-preview',
    pkgJson,
    binPath,
    extraFiles,
  );
  createLegacyNativeAliasFixture(fixture.cwd);
  return fixture;
}

test('resolve stable TypeScript 7', () => {
  const fixture = createCompilerFixture(
    'typescript',
    {
      version: '7.0.2',
      type: 'module',
      bin: { tsc: './bin/tsc' },
    },
    'bin/tsc',
    ['lib/tsc.js'],
  );

  const resolvedBin = resolveTsgoBin(fixture.cwd);

  expect(fs.existsSync(resolvedBin)).toBe(true);
  expect(
    path.normalize(resolvedBin).endsWith(path.normalize('lib/tsc.js')),
  ).toBe(true);
});

test('ignore the legacy TypeScript package API', () => {
  const fixture = createCompilerFixture(
    'typescript',
    { version: '6.0.3', bin: { tsc: 'bin/tsc' } },
    'bin/tsc',
    ['lib/tsc.js'],
  );
  createLegacyNativeAliasFixture(fixture.cwd);

  expect(() => resolveTsgoBin(fixture.cwd)).toThrow('requires `typescript@^7`');
});

test('resolve the official TypeScript 7 side-by-side alias', () => {
  const legacyFixture = createCompilerFixture(
    'typescript',
    { version: '6.0.3', bin: { tsc6: 'bin/tsc6' } },
    'bin/tsc6',
    ['lib/tsc6.js'],
  );
  createCompilerFixture(
    '@typescript/native',
    {
      name: 'typescript',
      version: '7.0.2',
      type: 'module',
      bin: { tsc: './bin/tsc' },
    },
    'bin/tsc',
    ['lib/tsc.js'],
    legacyFixture.cwd,
  );

  const resolvedBin = resolveTsgoBin(legacyFixture.cwd);

  expect(
    path
      .normalize(resolvedBin)
      .endsWith(path.normalize('@typescript/native/lib/tsc.js')),
  ).toBe(true);
});

test('fall back to native preview for legacy TypeScript projects', () => {
  const legacyFixture = createCompilerFixture(
    'typescript',
    { version: '6.0.3', bin: { tsc: 'bin/tsc' } },
    'bin/tsc',
    ['lib/tsc.js'],
  );
  createLegacyNativeAliasFixture(legacyFixture.cwd);
  createCompilerFixture(
    '@typescript/native-preview',
    { version: '7.0.0-dev.20260629.1', bin: { tsgo: 'bin/tsgo' } },
    'bin/tsgo',
    ['lib/tsgo.js'],
    legacyFixture.cwd,
  );

  const resolvedBin = resolveTsgoBin(legacyFixture.cwd);

  expect(
    path
      .normalize(resolvedBin)
      .endsWith(path.normalize('@typescript/native-preview/lib/tsgo.js')),
  ).toBe(true);
});

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

(hasNativeTypeScript ? test : test.skip)(
  'build: bundless native TypeScript dts',
  async () => {
    process.env.APP_ROOT = CASE_DIR;
    await cli.run({
      args: { _: ['build'], $0: 'node' },
    });

    const fileMap = distToMap(path.join(CASE_DIR, 'dist'));

    expect(fileMap['esm/index.d.ts']).toContain('./value');
    expect(fileMap['esm/value.d.ts']).toContain(
      'export declare const value = "tsgo"',
    );
  },
);
