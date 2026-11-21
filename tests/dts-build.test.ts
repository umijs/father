import { spawnSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

let cwd: string;

function write(file: string, content: string) {
  const target = path.join(cwd, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function configure(compilerOptions: Record<string, boolean>) {
  write(
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: { skipLibCheck: true, types: [], ...compilerOptions },
      include: ['src', 'outside'],
    }),
  );
}

function build(cache = false) {
  const result = spawnSync(
    process.execPath,
    [path.resolve(__dirname, '../bin/father.js'), 'build'],
    {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        APP_ROOT: cwd,
        FATHER_CACHE: cache ? '' : 'none',
        FATHER_CACHE_DIR: 'node_modules/.cache/father',
        FATHER_TSCONFIG_NAME: 'tsconfig.json',
        NODE_PATH: '',
      },
    },
  );
  if (result.error) throw result.error;
  return { status: result.status, log: result.stdout + result.stderr };
}

function hasDeclaration() {
  return fs.existsSync(path.join(cwd, 'dist/esm/index.d.ts'));
}

beforeEach(() => {
  cwd = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'father-dts-')));
  write('package.json', '{"name":"dts-build-fixture"}');
  write('src/index.ts', 'export const value = 1;');
  write(
    '.fatherrc.js',
    'export default { esm: { dts: { failOnError: true } } };',
  );
});

afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true });
});

test.each(['{}', '{ failOnError: false }'])(
  'declaration emit blocked by a diagnostic outside the build can still succeed with dts: %s',
  (dts) => {
    write('.fatherrc.js', `export default { esm: {}, dts: ${dts} };`);
    configure({ declaration: true, noEmitOnError: true });
    write('outside/index.ts', 'export const invalid: string = 1;');

    expect(build()).toMatchObject({ status: 0 });
    expect(hasDeclaration()).toBe(false);
  },
);

test('failOnError reports the diagnostic that blocked declaration emit', () => {
  configure({ declaration: true, noEmitOnError: true });
  write('outside/index.ts', 'export const invalid: string = 1;');

  const result = build();
  expect(result).toMatchObject({
    status: 1,
    log: expect.stringContaining('Declaration generation failed.'),
  });
  expect(result.log).toContain('TS2322');
  expect(hasDeclaration()).toBe(false);
});

test('failOnError accepts cached declarations unless a new diagnostic blocks emit', () => {
  configure({ declaration: true, noEmitOnError: true });
  write('outside/index.ts', 'export const valid: string = "value";');

  expect(build(true)).toMatchObject({ status: 0 });
  expect(hasDeclaration()).toBe(true);
  expect(build(true)).toMatchObject({ status: 0 });
  expect(hasDeclaration()).toBe(true);

  write('outside/index.ts', 'export const invalid: string = 1;');
  expect(build(true)).toMatchObject({
    status: 1,
    log: expect.stringContaining('TS2322'),
  });
  expect(hasDeclaration()).toBe(false);
});

test('failOnError fails when noEmit prevents scheduled declaration output', () => {
  configure({ declaration: true, noEmit: true });

  const result = build();
  expect(result).toMatchObject({
    status: 1,
    log: expect.stringContaining('Declaration generation failed.'),
  });
  expect(result.log).toContain('src/index.ts');
  expect(hasDeclaration()).toBe(false);
});

test('formats inherit failOnError and subdirectory overrides can disable it', () => {
  configure({ declaration: true, noEmit: true });
  write(
    '.fatherrc.js',
    `export default {
      dts: { failOnError: true },
      esm: {
        dts: { compiler: 'tsc' },
        overrides: { 'src/relaxed': { dts: { failOnError: false } } },
      },
    };`,
  );
  write('src/relaxed/index.ts', 'export const value = 2;');

  const result = build();
  expect(result).toMatchObject({
    status: 1,
    log: expect.stringContaining('src/index.ts'),
  });
  expect(result.log).not.toContain('src/relaxed/index.ts');

  fs.unlinkSync(path.join(cwd, 'src/index.ts'));
  expect(build()).toMatchObject({ status: 0 });
});

test('failOnError fails when tsgo exits successfully without writing a declaration', () => {
  configure({ declaration: true });
  write(
    '.fatherrc.js',
    "export default { esm: { dts: { compiler: 'tsgo', failOnError: true } } };",
  );
  write(
    'node_modules/@typescript/native-preview/package.json',
    '{"name":"@typescript/native-preview","bin":{"tsgo":"bin/tsgo.js"}}',
  );
  write(
    'node_modules/@typescript/native-preview/bin/tsgo.js',
    'require("fs").writeFileSync("tsgo-called", "");',
  );

  const result = build();
  expect(fs.existsSync(path.join(cwd, 'tsgo-called'))).toBe(true);
  expect(result).toMatchObject({
    status: 1,
    log: expect.stringContaining('Declaration generation failed.'),
  });
  expect(result.log).toContain('src/index.ts');
  expect(hasDeclaration()).toBe(false);
});

test('failOnError allows builds with declaration generation disabled', () => {
  configure({ declaration: false });

  expect(build()).toMatchObject({ status: 0 });
  expect(fs.existsSync(path.join(cwd, 'dist/esm/index.js'))).toBe(true);
  expect(hasDeclaration()).toBe(false);
});
