import { MagicString, remapping } from '@umijs/utils';
import Joi from '@umijs/utils/compiled/@hapi/joi';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import builder from '../src/builder';
import { addLoader, addTransformer } from '../src/builder/bundless';
import { finalizeEsm } from '../src/builder/bundless/esm';
import { createConfigProviders } from '../src/builder/config';
import { getSchemas } from '../src/features/configPlugins/schema';
import type { IFatherConfig } from '../src/types';
import { distToMap } from './utils';

const fixtures: string[] = [];
const compiled = path.resolve(__dirname, '../dist/builder/bundless/loaders');

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
  addLoader({
    id: 'js',
    test: /((?<!\.d)\.ts|\.(jsx?|tsx))$/,
    loader: path.join(compiled, 'javascript/index.js'),
  });
  for (const transformer of ['babel', 'esbuild', 'swc']) {
    addTransformer({
      id: transformer,
      transformer: path.join(compiled, `javascript/${transformer}.js`),
    });
  }
});

afterAll(() => {
  delete process.env.FATHER_CACHE;
  fixtures.forEach((cwd) => fs.rmSync(cwd, { recursive: true, force: true }));
});

function write(cwd: string, file: string, content: string | object) {
  const target = path.join(cwd, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(
    target,
    typeof content === 'string' ? content : JSON.stringify(content),
  );
}

function fixture(files: Record<string, string | object>) {
  const cwd = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'father-native-esm-')),
  );
  fixtures.push(cwd);
  Object.entries(files).forEach(([file, content]) => write(cwd, file, content));
  return cwd;
}

function read(cwd: string, file: string) {
  return fs.readFileSync(path.join(cwd, file), 'utf-8');
}

const pkg = {
  name: 'native-esm-fixture',
  exports: {
    '.': { import: './dist/esm/index.js', require: './dist/cjs/index.js' },
  },
};

const tsconfig = {
  compilerOptions: {
    target: 'es2020',
    module: 'esnext',
    moduleResolution: 'node',
    declaration: true,
    declarationMap: true,
    esModuleInterop: true,
    strict: true,
    baseUrl: '.',
    paths: { '@/*': ['./src/*'] },
    types: [],
  },
  include: ['src'],
};

const esmOptions = {
  fullySpecified: true,
  resolveDepSubpath: true,
  outputPackageType: 'module',
} as const;

test.each([
  {},
  { main: './dist/cjs/index.js', module: './dist/esm/index.js' },
  { type: 'module' },
  { exports: { import: './dist/esm/index.js' } },
  { exports: pkg.exports },
  {
    exports: {
      './*': {
        node: {
          import: { types: './dist/esm/*.d.ts', default: './dist/esm/*.js' },
        },
      },
    },
  },
  { exports: { import: [null, './dist/esm/index.js'] } },
])(
  'package metadata does not enable ESM processing: %j',
  async (packageJson) => {
    const cwd = fixture({
      'package.json': packageJson,
      'src/index.js': "export * from './nested';",
      'src/index.d.ts': "export * from './nested';",
      'src/nested/index.js': 'export const value = 1;',
      'src/nested/index.d.ts': 'export declare const value: 1;',
      'src/nested/package.json':
        '{ "sideEffects": false, "type": "commonjs" }\n',
    });
    const userConfig: IFatherConfig = {
      esm: { transformer: 'esbuild' },
      cjs: {},
    };
    const config = createConfigProviders(userConfig, packageJson, cwd).bundless
      .esm!.configs[0];
    expect(config.fullySpecified).toBeUndefined();
    expect(config.resolveDepSubpath).toBeUndefined();
    expect(config.outputPackageType).toBeUndefined();
    await builder({ cwd, pkg: packageJson, userConfig });
    const original = distToMap(path.join(cwd, 'dist'));
    expect(original['esm/package.json']).toBeUndefined();
    for (const file of ['index.js', 'index.d.ts']) {
      expect(read(cwd, `dist/esm/${file}`)).toContain('./nested');
      expect(read(cwd, `dist/esm/${file}`)).not.toContain('./nested/index.js');
    }
    expect(read(cwd, 'dist/esm/nested/package.json')).toBe(
      read(cwd, 'src/nested/package.json'),
    );
    await builder({
      cwd,
      pkg: packageJson,
      userConfig: {
        ...userConfig,
        esm: {
          ...userConfig.esm,
          fullySpecified: false,
          resolveDepSubpath: false,
        },
      },
    });
    expect(distToMap(path.join(cwd, 'dist'))).toEqual(original);
  },
);

test('output options are ESM-only and validate independently', () => {
  expect(getSchemas().esm(Joi).validate(esmOptions).error).toBeUndefined();
  for (const options of [
    { fullySpecified: 'invalid' },
    { resolveDepSubpath: 'invalid' },
    { outputPackageType: 'commonjs' },
  ])
    expect(getSchemas().esm(Joi).validate(options).error).toBeDefined();
  for (const options of [
    { fullySpecified: true },
    { resolveDepSubpath: true },
    { outputPackageType: 'module' },
  ])
    expect(getSchemas().cjs(Joi).validate(options).error).toBeDefined();
});

test.each(['dist/cjs', 'dist', 'dist/cjs/nested'])(
  'rejects package markers overlapping CJS output %s before cleaning',
  async (output) => {
    const cwd = fixture({ 'dist/cjs/existing.js': 'keep me' });
    expect(() =>
      createConfigProviders(
        { esm: { fullySpecified: true, output }, cjs: {} },
        pkg,
        cwd,
      ),
    ).not.toThrow();
    await expect(
      builder({
        cwd,
        pkg,
        userConfig: { esm: { outputPackageType: 'module', output }, cjs: {} },
      }),
    ).rejects.toThrow('separate directories');
    expect(read(cwd, 'dist/cjs/existing.js')).toBe('keep me');
  },
);

test.each([
  [false, false, false],
  [true, false, false],
  [false, true, false],
  [false, false, true],
  [true, true, false],
  [true, false, true],
  [false, true, true],
  [true, true, true],
])(
  'options act independently: relative=%s dependencies=%s package=%s',
  async (fullySpecified, resolveDepSubpath, marker) => {
    const cwd = fixture({
      'package.json': pkg,
      'src/index.js':
        "export * from './nested'; export { default as plugin } from 'legacy/plugin';",
      'src/index.d.ts':
        "export * from './nested'; export { default as plugin } from 'legacy/plugin';",
      'src/nested/index.js': 'export const value = 1;',
      'src/nested/index.d.ts': 'export declare const value: 1;',
      'src/nested/package.json':
        '{ "sideEffects": false, "type": "commonjs" }\n',
      'node_modules/legacy/package.json': { name: 'legacy' },
      'node_modules/legacy/plugin.js': 'module.exports = 7;',
    });
    await builder({
      cwd,
      pkg,
      userConfig: {
        esm: {
          transformer: 'esbuild',
          fullySpecified,
          resolveDepSubpath,
          ...(marker ? { outputPackageType: 'module' } : {}),
        },
      },
    });
    for (const file of ['index.js', 'index.d.ts']) {
      const content = read(cwd, `dist/esm/${file}`);
      expect(content.includes('./nested/index.js')).toBe(fullySpecified);
      expect(content.includes('legacy/plugin.js')).toBe(resolveDepSubpath);
    }
    if (marker) {
      expect(JSON.parse(read(cwd, 'dist/esm/package.json'))).toEqual({
        type: 'module',
      });
      expect(JSON.parse(read(cwd, 'dist/esm/nested/package.json'))).toEqual({
        sideEffects: false,
        type: 'module',
      });
    } else {
      expect(fs.existsSync(path.join(cwd, 'dist/esm/package.json'))).toBe(
        false,
      );
      expect(read(cwd, 'dist/esm/nested/package.json')).toBe(
        read(cwd, 'src/nested/package.json'),
      );
    }
  },
);

test.each(['babel', 'esbuild', 'swc'] as const)(
  '%s emits native ESM and NodeNext declarations while preserving CJS',
  async (transformer) => {
    const cwd = fixture({
      'package.json': pkg,
      'tsconfig.json': tsconfig,
      'src/index.ts': `
      export { value } from '@/value';
      export * from './nested';
      export { default as legacy } from 'legacy/plugin';
      export { default as modern } from 'modern/feature';
      export const load = () => import('./nested');
      export type Value = import('./value').Value;
    `,
      'src/value.ts':
        'export const value = 42; export interface Value { value: number }',
      'src/nested/index.ts': "export { value as nested } from '../value';",
      'node_modules/legacy/package.json': { name: 'legacy' },
      'node_modules/legacy/plugin.js': 'module.exports = 7;',
      'node_modules/legacy/plugin.d.ts':
        'declare const plugin: 7; export = plugin;',
      'node_modules/modern/package.json': {
        name: 'modern',
        type: 'module',
        exports: {
          './feature': {
            types: './feature.d.ts',
            import: './feature.js',
            require: './feature.cjs',
          },
        },
      },
      'node_modules/modern/feature.js': 'export default 8;',
      'node_modules/modern/feature.cjs': 'module.exports = 8;',
      'node_modules/modern/feature.d.ts':
        'declare const feature: 8; export default feature;',
    });
    const userConfig: IFatherConfig = {
      esm: { transformer, ...esmOptions },
      cjs: {},
      sourcemap: true,
      targets: { node: '18' },
    };
    await builder({ cwd, pkg, userConfig });
    const firstCjs = distToMap(path.join(cwd, 'dist/cjs'));
    const esm = read(cwd, 'dist/esm/index.js');
    const dts = read(cwd, 'dist/esm/index.d.ts');
    expect(esm).toContain('./value.js');
    expect(esm).toContain('./nested/index.js');
    expect(esm).toContain('legacy/plugin.js');
    expect(esm).toContain('modern/feature');
    expect(esm).not.toContain('modern/feature.js');
    expect(dts).toContain('./value.js');
    expect(dts).toContain('./nested/index.js');
    expect(dts).toContain('legacy/plugin.js');
    expect(JSON.parse(read(cwd, 'dist/esm/package.json'))).toEqual({
      type: 'module',
    });
    for (const file of ['index.js.map', 'index.d.ts.map']) {
      const map = JSON.parse(read(cwd, `dist/esm/${file}`));
      expect(map.sources).toEqual(['../../src/index.ts']);
      expect(map.mappings).not.toBe('');
    }
    const result = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
    import { createRequire } from 'node:module';
    const esm = await import('native-esm-fixture');
    const cjs = createRequire(import.meta.url)('native-esm-fixture');
    console.log(JSON.stringify([esm.value, esm.nested, (await esm.load()).nested, esm.legacy, esm.modern, cjs.value, cjs.legacy, cjs.modern]));
  `,
      ],
      { cwd, encoding: 'utf-8' },
    );
    expect(JSON.parse(result)).toEqual([42, 42, 42, 7, 8, 42, 7, 8]);
    write(
      cwd,
      'consumer.mts',
      `import { value, nested, legacy, modern, load, type Value } from 'native-esm-fixture';
    const n: number = value + nested + legacy + modern;
    const v: Value = { value: n };
    load().then(m => { const x: number = m.nested; });`,
    );
    try {
      execFileSync(
        process.execPath,
        [
          require.resolve('typescript/bin/tsc'),
          '--noEmit',
          '--strict',
          '--module',
          'NodeNext',
          '--moduleResolution',
          'NodeNext',
          '--target',
          'es2020',
          'consumer.mts',
        ],
        { cwd, stdio: 'pipe' },
      );
    } catch (error: any) {
      throw new Error(error.stdout?.toString() || error.message);
    }
    await builder({
      cwd,
      pkg,
      userConfig: { ...userConfig, esm: { transformer } },
    });
    expect(distToMap(path.join(cwd, 'dist/cjs'))).toEqual(firstCjs);
    expect(fs.existsSync(path.join(cwd, 'dist/esm/package.json'))).toBe(false);
    expect(read(cwd, 'dist/esm/index.js')).not.toContain('./value.js');
  },
);

test('rewrites only module specifiers, preserves suffixes, and composes source maps', () => {
  const code = `import './value'; export const after = 1;
// import './missing';
const text = "import './missing'";
const untouched = require('./value');
import('./nested?raw=1#hash');
import(name);
export * from './dotted.name';
export * from './module.mjs';
import './style.css';
import '#internal';
import 'node:fs/promises';
import 'optional/missing';
import 'https://example.com/module';
import '@scope/legacy/nested';
export { explicit } from './explicit.ts';
`;
  const cwd = fixture({
    'dist/esm/index.js': code,
    'dist/esm/value.js': 'export const value = 1;',
    'dist/esm/nested/index.js': 'export {};',
    'dist/esm/dotted.name.js': 'export {};',
    'dist/esm/module.mjs': 'export {};',
    'dist/esm/style.css': '',
    'src/explicit.ts': 'export const explicit = 1;',
    'dist/esm/explicit.js': 'export const explicit = 1;',
    'node_modules/@scope/legacy/package.json': { name: '@scope/legacy' },
    'node_modules/@scope/legacy/nested/index.js': 'module.exports = 1;',
    'dist/esm/index.d.ts': `export type T = import('./types').T;
declare module './value' { export const added: number; }
declare const untouched: "from './missing'";
// export * from './missing';
`,
    'dist/esm/types.d.ts': 'export interface T {}',
    'dist/esm/package.json': { sideEffects: false, type: 'commonjs' },
  });
  const map = new MagicString(code).generateMap({
    hires: true,
    source: '../../src/index.ts',
    includeContent: true,
  });
  write(cwd, 'dist/esm/index.js.map', map);
  const provider = createConfigProviders({ esm: { ...esmOptions } }, {}, cwd)
    .bundless.esm!;
  const outputs = ['index.js', 'index.d.ts'].map((file) => ({
    file: path.join(cwd, 'dist/esm', file),
    sourceFile: path.join(cwd, 'src/index.ts'),
  }));
  finalizeEsm(outputs, cwd, provider);
  const result = read(cwd, 'dist/esm/index.js');
  expect(result).toContain('./nested/index.js?raw=1#hash');
  expect(result).toContain('./dotted.name.js');
  expect(result).toContain('./explicit.js');
  expect(result).toContain('@scope/legacy/nested/index.js');
  for (const unchanged of [
    "// import './missing';",
    '"import \'./missing\'"',
    "require('./value')",
    'import(name)',
    "'./module.mjs'",
    "'./style.css'",
    "'#internal'",
    "'node:fs/promises'",
    "'optional/missing'",
    "'https://example.com/module'",
  ])
    expect(result).toContain(unchanged);
  expect(read(cwd, 'dist/esm/index.d.ts')).toContain('import("./types.js")');
  expect(read(cwd, 'dist/esm/index.d.ts')).toContain('module "./value.js"');
  expect(read(cwd, 'dist/esm/index.d.ts')).toContain('"from \'./missing\'"');
  expect(JSON.parse(read(cwd, 'dist/esm/package.json'))).toEqual({
    sideEffects: false,
    type: 'module',
  });
  // Inspect the decoded mapping after the longer import on the same line.
  const composed = remapping(
    JSON.parse(read(cwd, 'dist/esm/index.js.map')),
    () => null,
    { decodedMappings: true },
  );
  expect(composed.mappings[0]).toContainEqual([
    result.indexOf('after'),
    0,
    0,
    code.indexOf('after'),
  ]);
  const files = distToMap(path.join(cwd, 'dist'));
  finalizeEsm(outputs, cwd, provider);
  expect(distToMap(path.join(cwd, 'dist'))).toEqual(files);
});

test('reports unresolved relative modules with the importing file', async () => {
  const cwd = fixture({ 'src/index.js': "export * from './missing';" });
  await expect(
    builder({ cwd, pkg: {}, userConfig: { esm: { fullySpecified: true } } }),
  ).rejects.toThrow(
    'Cannot resolve fully specified ESM import "./missing" from dist',
  );
});

test('relocates overrides, marks copied package scopes, and handles cache hits', async () => {
  const cwd = fixture({
    'package.json': pkg,
    'tsconfig.json': tsconfig,
    'src/index.ts': "export { value } from './nested';",
    'src/nested/index.ts': 'export const value = 12;',
    'src/nested/package.json': { sideEffects: false, type: 'commonjs' },
  });
  const userConfig: IFatherConfig = {
    esm: {
      fullySpecified: true,
      outputPackageType: 'module',
      overrides: { 'src/nested': { output: 'custom/nested' } },
    },
  };
  delete process.env.FATHER_CACHE;
  try {
    await builder({ cwd, pkg, userConfig });
    expect(read(cwd, 'dist/esm/index.js')).toContain(
      '../../custom/nested/index.js',
    );
    expect(read(cwd, 'dist/esm/index.d.ts')).toContain(
      '../../custom/nested/index.js',
    );
    expect(JSON.parse(read(cwd, 'custom/nested/package.json'))).toEqual({
      sideEffects: false,
      type: 'module',
    });
    const first = distToMap(path.join(cwd, 'dist'));
    await builder({ cwd, pkg, userConfig });
    expect(distToMap(path.join(cwd, 'dist'))).toEqual(first);
    expect(
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `console.log((await import(${JSON.stringify(
            pathToFileURL(path.join(cwd, 'dist/esm/index.js')).href,
          )})).value)`,
        ],
        { encoding: 'utf-8' },
      ).trim(),
    ).toBe('12');
  } finally {
    process.env.FATHER_CACHE = 'none';
  }
});

test('watch rewrites changed JS, copied declarations and newly added modules', async () => {
  const cwd = fixture({ 'src/index.js': 'export const initial = 1;' });
  const watcher = await builder({
    cwd,
    pkg: {},
    userConfig: {
      esm: {
        fullySpecified: true,
        outputPackageType: 'module',
        transformer: 'esbuild',
      },
    },
    watch: true,
  });
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    write(cwd, 'src/new/index.js', 'export const value = 2;');
    write(cwd, 'src/new/index.d.ts', 'export declare const value: 2;');
    write(cwd, 'src/index.js', "export { value } from './new';");
    write(cwd, 'src/index.d.ts', "export { value } from './new';");
    const deadline = Date.now() + 15000;
    while (true) {
      if (
        fs.existsSync(path.join(cwd, 'dist/esm/index.d.ts')) &&
        read(cwd, 'dist/esm/index.js').includes('./new/index.js') &&
        read(cwd, 'dist/esm/index.d.ts').includes('./new/index.js')
      )
        break;
      if (Date.now() > deadline)
        throw new Error('Timed out waiting for native ESM watch output');
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(JSON.parse(read(cwd, 'dist/esm/package.json'))).toEqual({
      type: 'module',
    });
  } finally {
    await watcher.close();
  }
});

test('parallel build finalizes native ESM after workers finish', () => {
  const cwd = fixture({
    'package.json': pkg,
    'src/index.js': "export { value } from './nested';",
    'src/nested/index.js': 'export const value = 5;',
    '.fatherrc.js': `export default { esm: { parallel: true, fullySpecified: true, outputPackageType: 'module' } };`,
  });
  execFileSync(
    process.execPath,
    [path.resolve(__dirname, '../bin/father.js'), 'build'],
    { cwd, env: { ...process.env, APP_ROOT: cwd }, stdio: 'pipe' },
  );
  expect(read(cwd, 'dist/esm/index.js')).toContain('./nested/index.js');
  expect(JSON.parse(read(cwd, 'dist/esm/package.json'))).toEqual({
    type: 'module',
  });
});
