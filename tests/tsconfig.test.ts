import { winPath } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import getDeclarations, {
  getTsconfig,
  withTsconfigCache,
} from '../src/builder/bundless/dts';

const ENV_KEYS = [
  'FATHER_TSCONFIG_NAME',
  'FATHER_CACHE',
  'FATHER_CACHE_DIR',
  'NODE_ENV',
] as const;

let cwd: string;
let originalEnv: Partial<Record<(typeof ENV_KEYS)[number], string>>;

function writeFile(file: string, content: string) {
  const filename = path.join(cwd, file);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, content);
  return winPath(filename);
}

function writeConfig(config: object, filename = 'tsconfig.json') {
  return writeFile(filename, JSON.stringify(config));
}

beforeEach(() => {
  const fixtureParent = path.join(process.cwd(), 'node_modules', '.cache');
  fs.mkdirSync(fixtureParent, { recursive: true });
  cwd = fs.mkdtempSync(path.join(fixtureParent, 'father-tsconfig-'));
  originalEnv = {};
  ENV_KEYS.forEach((key) => {
    originalEnv[key] = process.env[key];
  });
  delete process.env.FATHER_TSCONFIG_NAME;
});

afterEach(() => {
  jest.restoreAllMocks();
  ENV_KEYS.forEach((key) => {
    if (originalEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = originalEnv[key];
    }
  });
  fs.rmSync(cwd, { recursive: true, force: true });
});

test('scans a shared tsconfig only once for files in different directories', () => {
  const first = writeFile('src/first/index.ts', 'export const first = 1;');
  const second = writeFile('src/second/index.ts', 'export const second = 2;');
  writeConfig({ compilerOptions: { declaration: true }, include: ['src'] });
  const readDirectory = jest.spyOn(ts.sys, 'readDirectory');

  withTsconfigCache(() => {
    for (const directory of [cwd, path.dirname(first), path.dirname(second)]) {
      const config = getTsconfig(directory)!;
      expect(config.options.declaration).toBe(true);
      expect(config.fileNames).toEqual(expect.arrayContaining([first, second]));
    }
  });

  expect(readDirectory).toHaveBeenCalledTimes(1);
});

test('keeps the nearest tsconfig for nested source directories', () => {
  const outer = writeFile('src/index.ts', 'export const outer = 1;');
  const inner = writeFile('src/nested/index.ts', 'export const inner = 2;');
  writeConfig({ compilerOptions: { jsx: 'react-jsx' }, include: ['src'] });
  writeConfig(
    { compilerOptions: { jsx: 'react' }, include: ['*.ts'] },
    'src/nested/tsconfig.json',
  );

  withTsconfigCache(() => {
    expect(getTsconfig(path.dirname(outer))!.options.jsx).toBe(
      ts.JsxEmit.ReactJSX,
    );
    const nestedConfig = getTsconfig(path.dirname(inner))!;
    expect(nestedConfig.options.jsx).toBe(ts.JsxEmit.React);
    expect(nestedConfig.fileNames).toEqual([inner]);
    expect(getTsconfig(cwd)!.options.jsx).toBe(ts.JsxEmit.ReactJSX);
  });
});

test('reads current configuration outside a build scope', () => {
  writeFile('src/index.ts', 'export const value = 1;');
  writeConfig({ compilerOptions: { strict: false }, include: ['src'] });
  expect(getTsconfig(cwd)!.options.strict).toBe(false);

  writeConfig({ compilerOptions: { strict: true }, include: ['src'] });
  expect(getTsconfig(cwd)!.options.strict).toBe(true);
});

test('refreshes extended configuration and included files for the next batch', () => {
  const first = writeFile('src/first.ts', 'export const first = 1;');
  writeConfig({ compilerOptions: { strict: false } }, 'tsconfig.base.json');
  writeConfig({ extends: './tsconfig.base.json', include: ['src'] });

  withTsconfigCache(() => {
    expect(getTsconfig(cwd)!.options.strict).toBe(false);
    expect(getTsconfig(cwd)!.fileNames).toEqual([first]);
  });

  writeConfig({ compilerOptions: { strict: true } }, 'tsconfig.base.json');
  const second = writeFile('src/second.ts', 'export const second = 2;');

  withTsconfigCache(() => {
    const config = getTsconfig(cwd)!;
    expect(config.options.strict).toBe(true);
    expect(config.fileNames).toEqual(expect.arrayContaining([first, second]));
    expect(config.fileNames).toHaveLength(2);
  });

  writeConfig({ extends: './tsconfig.base.json', files: ['src/second.ts'] });
  withTsconfigCache(() => {
    expect(getTsconfig(cwd)!.fileNames).toEqual([second]);
  });
});

test('respects custom config names when they change within a scope', () => {
  writeFile('src/index.ts', 'export const value = 1;');
  writeConfig({ compilerOptions: { strict: false }, include: ['src'] });
  writeConfig(
    { compilerOptions: { strict: true }, include: ['src'] },
    'tsconfig.custom.json',
  );

  withTsconfigCache(() => {
    expect(getTsconfig(cwd)!.options.strict).toBe(false);
    process.env.FATHER_TSCONFIG_NAME = 'tsconfig.custom.json';
    expect(getTsconfig(cwd)!.options.strict).toBe(true);
    delete process.env.FATHER_TSCONFIG_NAME;
    expect(getTsconfig(cwd)!.options.strict).toBe(false);
  });
});

test('does not keep missing configurations across batches', () => {
  const filename = `${path.basename(cwd)}.json`;
  process.env.FATHER_TSCONFIG_NAME = filename;
  writeFile('src/index.ts', 'export const value = 1;');
  withTsconfigCache(() => {
    expect(getTsconfig(cwd)).toBeUndefined();
    expect(getTsconfig(cwd)).toBeUndefined();
  });

  writeConfig(
    { compilerOptions: { strict: true }, include: ['src'] },
    filename,
  );
  withTsconfigCache(() => {
    expect(getTsconfig(cwd)!.options.strict).toBe(true);
  });
});

test('keeps overlapping asynchronous build scopes independent', async () => {
  writeFile('src/index.ts', 'export const value = 1;');
  writeConfig({ compilerOptions: { strict: false }, include: ['src'] });
  let releaseFirst!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseFirst = resolve;
  });

  const firstBuild = withTsconfigCache(async () => {
    expect(getTsconfig(cwd)!.options.strict).toBe(false);
    await gate;
    expect(getTsconfig(cwd)!.options.strict).toBe(false);
  });

  writeConfig({ compilerOptions: { strict: true }, include: ['src'] });
  try {
    await withTsconfigCache(async () => {
      expect(getTsconfig(cwd)!.options.strict).toBe(true);
      await Promise.resolve();
      expect(getTsconfig(cwd)!.options.strict).toBe(true);
    });
  } finally {
    releaseFirst();
    await firstBuild;
  }
});

test('declaration generation does not change cached compiler options', async () => {
  const sourceFile = writeFile('src/index.ts', 'export const value = 1;');
  writeConfig({
    compilerOptions: {
      declaration: true,
      target: 'ES2019',
      types: [],
      skipLibCheck: true,
    },
    include: ['src'],
  });
  process.env.NODE_ENV = 'development';
  delete process.env.FATHER_CACHE;
  // Both process-relative and fixture-relative cache paths stay inside the
  // fixture. A relative path also avoids joining two Windows drive paths.
  process.env.FATHER_CACHE_DIR = path.relative(
    process.cwd(),
    path.join(cwd, 'cache'),
  );

  await withTsconfigCache(async () => {
    const before = { ...getTsconfig(cwd)!.options };
    const declarations = await getDeclarations([sourceFile], { cwd });

    expect(declarations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: 'index.d.ts',
          content: expect.stringContaining('export declare const value = 1;'),
        }),
        expect.objectContaining({ file: 'index.d.ts.map' }),
      ]),
    );
    expect(getTsconfig(cwd)!.options).toEqual(before);
  });
});
