import { MagicString, remapping } from '@umijs/utils';
import Joi from '@umijs/utils/compiled/@hapi/joi';
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { pathToFileURL } from 'url';
import builder from '../src/builder';
import { addLoader, addTransformer } from '../src/builder/bundless';
import { finalizeOutputs } from '../src/builder/bundless/output';
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

const redirect = { js: { extension: true }, dts: { extension: true } };

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
])(
  'package metadata does not enable output processing: %j',
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
    expect(config.autoExtension).toBeUndefined();
    expect(config.redirect).toBeUndefined();
    expect(config.resolveDepSubpath).toBeUndefined();
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
    const disabled = {
      autoExtension: false,
      redirect: { js: { extension: false }, dts: { extension: false } },
    };
    await builder({
      cwd,
      pkg: packageJson,
      userConfig: {
        esm: { ...userConfig.esm, ...disabled, resolveDepSubpath: false },
        cjs: disabled,
      },
    });
    expect(distToMap(path.join(cwd, 'dist'))).toEqual(original);
  },
);

test('validates shared output options and ESM-only dependency resolution', () => {
  for (const format of ['esm', 'cjs']) {
    const schema = getSchemas()[format](Joi);
    expect(
      schema.validate({ autoExtension: true, redirect }).error,
    ).toBeUndefined();
    for (const invalid of [
      { autoExtension: 'invalid' },
      { redirect: { js: { extension: 'invalid' } } },
      { redirect: { dts: { extension: 'invalid' } } },
      { fullySpecified: true },
      { outputPackageType: 'module' },
    ])
      expect(schema.validate(invalid).error).toBeDefined();
  }
  expect(
    getSchemas().esm(Joi).validate({ resolveDepSubpath: true }).error,
  ).toBeUndefined();
  expect(
    getSchemas().cjs(Joi).validate({ resolveDepSubpath: true }).error,
  ).toBeDefined();
});

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
  'redirect and dependencies are independent: js=%s dts=%s deps=%s',
  async (js, dts, resolveDepSubpath) => {
    const cwd = fixture({
      'src/index.js':
        "export * from './nested'; export { default as plugin } from 'legacy/plugin';",
      'src/index.d.ts':
        "export * from './nested'; export { default as plugin } from 'legacy/plugin';",
      'src/nested/index.js': 'export const value = 1;',
      'src/nested/index.d.ts': 'export declare const value: 1;',
      'node_modules/legacy/package.json': { name: 'legacy' },
      'node_modules/legacy/plugin.js': 'module.exports = 7;',
    });
    await builder({
      cwd,
      pkg,
      userConfig: {
        esm: {
          transformer: 'esbuild',
          resolveDepSubpath,
          redirect: { js: { extension: js }, dts: { extension: dts } },
        },
      },
    });
    for (const [file, enabled] of [
      ['index.js', js],
      ['index.d.ts', dts],
    ] as const) {
      const content = read(cwd, `dist/esm/${file}`);
      expect(content.includes('./nested/index.js')).toBe(enabled);
      expect(content.includes('legacy/plugin.js')).toBe(resolveDepSubpath);
    }
    expect(fs.existsSync(path.join(cwd, 'dist/esm/package.json'))).toBe(false);
  },
);

const variants = (['babel', 'esbuild', 'swc'] as const).flatMap((transformer) =>
  [undefined, 'commonjs', 'module'].map((type) => ({ transformer, type })),
);

test.each(variants)(
  '$transformer supports import, require and NodeNext with type=$type',
  async ({ transformer, type }) => {
    const esmExt = type === 'module' ? 'js' : 'mjs';
    const cjsExt = type === 'module' ? 'cjs' : 'js';
    const esmDts = type === 'module' ? 'ts' : 'mts';
    const cjsDts = type === 'module' ? 'cts' : 'ts';
    const packageJson = {
      name: pkg.name,
      ...(type ? { type } : {}),
      exports: {
        '.': {
          import: {
            types: `./dist/esm/index.d.${esmDts}`,
            default: `./dist/esm/index.${esmExt}`,
          },
          require: {
            types: `./dist/cjs/index.d.${cjsDts}`,
            default: `./dist/cjs/index.${cjsExt}`,
          },
        },
      },
    };
    const cwd = fixture({
      'package.json': packageJson,
      'tsconfig.json': tsconfig,
      'src/index.ts': `export { value } from '@/value'; export * from './nested';
      export { default as legacy } from 'legacy/plugin';
      export { default as modern } from 'modern/feature';
      export const load = () => import('./nested'); export type Value = import('./value').Value;`,
      'src/value.ts':
        'export const value = 42; export interface Value { value: number }',
      'src/nested/index.ts': "export { value as nested } from '../value.js';",
      'node_modules/legacy/package.json': { name: 'legacy' },
      'node_modules/legacy/plugin.js': 'module.exports = 7;',
      'node_modules/legacy/plugin.d.ts':
        'declare const plugin: 7; export = plugin;',
      'node_modules/modern/package.json': {
        name: 'modern',
        type: 'module',
        exports: {
          './feature': {
            import: { types: './feature.d.mts', default: './feature.js' },
            require: { types: './feature.d.cts', default: './feature.cjs' },
          },
        },
      },
      'node_modules/modern/feature.js': 'export default 8;',
      'node_modules/modern/feature.cjs': 'module.exports = 8;',
      'node_modules/modern/feature.d.ts':
        'declare const feature: 8; export default feature;',
      'node_modules/modern/feature.d.mts':
        'declare const feature: 8; export default feature;',
      'node_modules/modern/feature.d.cts':
        'declare const feature: 8; export = feature;',
    });
    const userConfig: IFatherConfig = {
      esm: { transformer, autoExtension: true, resolveDepSubpath: true },
      cjs: { transformer, autoExtension: true },
      sourcemap: true,
      targets: { node: '18' },
    };
    await builder({ cwd, pkg: packageJson, userConfig });
    for (const [format, ext, dts] of [
      ['esm', esmExt, esmDts],
      ['cjs', cjsExt, cjsDts],
    ]) {
      const js = read(cwd, `dist/${format}/index.${ext}`);
      const types = read(cwd, `dist/${format}/index.d.${dts}`);
      expect(js).toContain(`./value.${ext}`);
      expect(js).toContain(`./nested/index.${ext}`);
      expect(types).toContain(`./value.${ext}`);
      expect(types).toContain(`./nested/index.${ext}`);
      expect(read(cwd, `dist/${format}/nested/index.${ext}`)).toContain(
        `../value.${ext}`,
      );
      expect(js).toContain('modern/feature');
      expect(js).not.toContain('modern/feature.js');
      if (format === 'esm') {
        expect(js).toContain('legacy/plugin.js');
        expect(types).toContain('legacy/plugin.js');
      }
      expect(fs.existsSync(path.join(cwd, `dist/${format}/package.json`))).toBe(
        false,
      );
      for (const file of [`index.${ext}`, `index.d.${dts}`]) {
        const map = JSON.parse(read(cwd, `dist/${format}/${file}.map`));
        expect(map.file).toBe(file);
        expect(map.sources).toEqual(['../../src/index.ts']);
        expect(map.mappings).not.toBe('');
        expect(read(cwd, `dist/${format}/${file}`)).toContain(
          `sourceMappingURL=${file}.map`,
        );
      }
    }
    expect(JSON.parse(read(cwd, 'package.json'))).toEqual(packageJson);
    const result = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
    import { createRequire } from 'node:module';
    const esm = await import('native-esm-fixture');
    const cjs = createRequire(import.meta.url)('native-esm-fixture');
    console.log(JSON.stringify([esm.value, (await esm.load()).nested, esm.legacy, esm.modern, cjs.value, (await cjs.load()).nested, cjs.legacy, cjs.modern]));
  `,
      ],
      { cwd, encoding: 'utf-8' },
    );
    expect(JSON.parse(result)).toEqual([42, 42, 7, 8, 42, 42, 7, 8]);
    for (const ext of ['mts', 'cts'])
      write(
        cwd,
        `consumer.${ext}`,
        `
    import { value, nested, legacy, modern, load, type Value } from 'native-esm-fixture';
    const v: Value = { value: value + nested + legacy + modern };
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
          'consumer.cts',
        ],
        { cwd, stdio: 'pipe' },
      );
    } catch (error: any) {
      throw new Error(error.stdout?.toString() || error.message);
    }
    const firstCjs = distToMap(path.join(cwd, 'dist/cjs'));
    await builder({
      cwd,
      pkg: packageJson,
      userConfig: { ...userConfig, esm: { transformer } },
    });
    expect(distToMap(path.join(cwd, 'dist/cjs'))).toEqual(firstCjs);
    expect(read(cwd, 'dist/esm/index.js')).not.toContain('./value.js');
    expect(fs.existsSync(path.join(cwd, 'dist/esm/index.mjs'))).toBe(false);
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
  const provider = createConfigProviders(
    { esm: { redirect, resolveDepSubpath: true } },
    {},
    cwd,
  ).bundless.esm!;
  const outputs = ['index.js', 'index.d.ts'].map((file) => ({
    file: path.join(cwd, 'dist/esm', file),
    sourceFile: path.join(cwd, 'src/index.ts'),
  }));
  finalizeOutputs(outputs, cwd, provider);
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
    type: 'commonjs',
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
  finalizeOutputs(outputs, cwd, provider);
  expect(distToMap(path.join(cwd, 'dist'))).toEqual(files);
});

test('reports unresolved relative modules with the importing file', async () => {
  const cwd = fixture({ 'src/index.js': "export * from './missing';" });
  await expect(
    builder({ cwd, pkg: {}, userConfig: { esm: { redirect } } }),
  ).rejects.toThrow('Cannot resolve module reference "./missing" from dist');
});

test('relocates overrides, respects copied package scopes, and handles cache hits', async () => {
  const cwd = fixture({
    'package.json': { ...pkg, type: 'module' },
    'tsconfig.json': tsconfig,
    'src/index.ts': "export { value } from './nested';",
    'src/nested/index.ts': 'export const value = 12;',
    'src/nested/package.json': { sideEffects: false, type: 'commonjs' },
  });
  const userConfig: IFatherConfig = {
    esm: {
      autoExtension: true,
      overrides: { 'src/nested': { output: 'custom/nested' } },
    },
  };
  delete process.env.FATHER_CACHE;
  try {
    await builder({ cwd, pkg: { ...pkg, type: 'module' }, userConfig });
    expect(read(cwd, 'dist/esm/index.js')).toContain(
      '../../custom/nested/index.mjs',
    );
    expect(read(cwd, 'dist/esm/index.d.ts')).toContain(
      '../../custom/nested/index.mjs',
    );
    expect(JSON.parse(read(cwd, 'custom/nested/package.json'))).toEqual({
      sideEffects: false,
      type: 'commonjs',
    });
    const first = distToMap(path.join(cwd, 'dist'));
    await builder({ cwd, pkg: { ...pkg, type: 'module' }, userConfig });
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

async function waitFor(check: () => boolean) {
  const deadline = Date.now() + 15000;
  while (!check()) {
    if (Date.now() > deadline) throw new Error('Timed out waiting for output');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

test.each([undefined, 'module'])(
  'watch rewrites and removes JS, declarations and maps with type=%s',
  async (type) => {
    const packageJson = type ? { type } : {};
    const cwd = fixture({
      'package.json': packageJson,
      'src/index.js': 'export const initial = 1;',
    });
    // Node 24's native Windows watcher can abort on temporary directory events.
    // Polling still exercises Father's real watch build and removal handlers.
    const previousPolling = process.env.CHOKIDAR_USEPOLLING;
    if (process.platform === 'win32') process.env.CHOKIDAR_USEPOLLING = 'true';
    const watcher = await builder({
      cwd,
      pkg: packageJson,
      userConfig: {
        esm: { autoExtension: true, transformer: 'esbuild' },
        cjs: { autoExtension: true },
        sourcemap: true,
      },
      watch: true,
    });
    const variants = [
      ['esm', type ? 'js' : 'mjs', type ? 'ts' : 'mts'],
      ['cjs', type ? 'cjs' : 'js', type ? 'cts' : 'ts'],
    ];
    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      write(cwd, 'src/new/index.js', 'export const value = 2;');
      write(cwd, 'src/new/index.d.ts', 'export declare const value: 2;');
      write(cwd, 'src/index.js', "export { value } from './new';");
      write(cwd, 'src/index.d.ts', "export { value } from './new';");
      await waitFor(() =>
        variants.every(
          ([format, ext, dts]) =>
            fs.existsSync(path.join(cwd, `dist/${format}/index.d.${dts}`)) &&
            read(cwd, `dist/${format}/index.${ext}`).includes(
              `./new/index.${ext}`,
            ) &&
            read(cwd, `dist/${format}/index.d.${dts}`).includes(
              `./new/index.${ext}`,
            ),
        ),
      );
      fs.unlinkSync(path.join(cwd, 'src/new/index.js'));
      fs.unlinkSync(path.join(cwd, 'src/new/index.d.ts'));
      await waitFor(() =>
        variants.every(([format, ext, dts]) =>
          [`index.${ext}`, `index.${ext}.map`, `index.d.${dts}`].every(
            (file) =>
              !fs.existsSync(path.join(cwd, `dist/${format}/new/${file}`)),
          ),
        ),
      );
    } finally {
      await watcher.close();
      if (previousPolling === undefined) delete process.env.CHOKIDAR_USEPOLLING;
      else process.env.CHOKIDAR_USEPOLLING = previousPolling;
    }
  },
);

test('parallel build emits and references selected extensions', () => {
  const cwd = fixture({
    'package.json': pkg,
    'src/index.js': "export { value } from './nested';",
    'src/nested/index.js': 'export const value = 5;',
    '.fatherrc.js':
      'export default { esm: { parallel: true, autoExtension: true }, cjs: { parallel: true, autoExtension: true } };',
  });
  execFileSync(
    process.execPath,
    [path.resolve(__dirname, '../bin/father.js'), 'build'],
    { cwd, env: { ...process.env, APP_ROOT: cwd }, stdio: 'pipe' },
  );
  expect(read(cwd, 'dist/esm/index.mjs')).toContain('./nested/index.mjs');
  expect(read(cwd, 'dist/cjs/index.js')).toContain('./nested/index.js');
  expect(fs.existsSync(path.join(cwd, 'dist/esm/package.json'))).toBe(false);
});

test('autoExtension allows independent redirect overrides and preserves copied declaration maps', async () => {
  const map = {
    version: 3,
    file: 'index.d.ts',
    sources: ['../../types/original.ts'],
    names: [],
    mappings: 'AAAA',
  };
  const cwd = fixture({
    'src/index.js': "export * from './value';",
    'src/index.d.ts':
      "export * from './value';\n//# sourceMappingURL=index.d.ts.map\n",
    'src/index.d.ts.map': map,
    'src/value.js': 'export const value = 1;',
    'src/value.d.ts': 'export declare const value: 1;',
  });
  await builder({
    cwd,
    pkg: {},
    userConfig: {
      esm: { autoExtension: true, redirect: { js: { extension: false } } },
    },
  });
  expect(read(cwd, 'dist/esm/index.mjs')).not.toContain('./value.mjs');
  expect(read(cwd, 'dist/esm/index.d.mts')).toContain('./value.mjs');
  expect(read(cwd, 'dist/esm/index.d.mts')).toContain(
    'sourceMappingURL=index.d.mts.map',
  );
  expect(JSON.parse(read(cwd, 'dist/esm/index.d.mts.map')).sources).toEqual(
    map.sources,
  );
  await builder({
    cwd,
    pkg: {},
    userConfig: {
      esm: { autoExtension: true, redirect: { dts: { extension: false } } },
    },
  });
  expect(read(cwd, 'dist/esm/index.mjs')).toContain('./value.mjs');
  expect(read(cwd, 'dist/esm/index.d.mts')).not.toContain('./value.mjs');
});

test('cached builds select new filenames when the package type changes', async () => {
  const cwd = fixture({
    'package.json': {},
    'tsconfig.json': tsconfig,
    'src/index.ts': "export { value } from './value';",
    'src/value.ts': 'export const value = 1;',
  });
  const userConfig = {
    esm: { autoExtension: true },
    cjs: { autoExtension: true },
    sourcemap: true,
  };
  delete process.env.FATHER_CACHE;
  try {
    await builder({ cwd, pkg: {}, userConfig });
    const first = distToMap(path.join(cwd, 'dist'));
    write(cwd, 'package.json', { type: 'module' });
    await builder({ cwd, pkg: { type: 'module' }, userConfig });
    expect(read(cwd, 'dist/esm/index.js')).toContain('./value.js');
    expect(read(cwd, 'dist/cjs/index.cjs')).toContain('./value.cjs');
    expect(read(cwd, 'dist/cjs/index.d.cts')).toContain('./value.cjs');
    expect(fs.existsSync(path.join(cwd, 'dist/esm/index.mjs'))).toBe(false);
    write(cwd, 'package.json', {});
    await builder({ cwd, pkg: {}, userConfig });
    expect(distToMap(path.join(cwd, 'dist'))).toEqual(first);
  } finally {
    process.env.FATHER_CACHE = 'none';
  }
});

test.each([undefined, 'module'])(
  'dual-format builds can share a directory with type=%s',
  async (type) => {
    const packageJson = type ? { type } : {};
    const cwd = fixture({
      'package.json': packageJson,
      'tsconfig.json': tsconfig,
      'src/index.ts': "export { value } from './value';",
      'src/value.ts': 'export const value = 9;',
    });
    const config = { autoExtension: true, output: 'dist' };
    await builder({
      cwd,
      pkg: packageJson,
      userConfig: { esm: config, cjs: config },
    });
    const esmExt = type ? 'js' : 'mjs';
    const cjsExt = type ? 'cjs' : 'js';
    const result = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `
    import { createRequire } from 'node:module';
    const esm = await import('./dist/index.${esmExt}');
    const cjs = createRequire(import.meta.url)('./dist/index.${cjsExt}');
    console.log(esm.value + cjs.value);
  `,
      ],
      { cwd, encoding: 'utf-8' },
    );
    expect(result.trim()).toBe('18');
    expect(read(cwd, `dist/index.d.${type ? 'ts' : 'mts'}`)).toContain(
      `./value.${esmExt}`,
    );
    expect(read(cwd, `dist/index.d.${type ? 'cts' : 'ts'}`)).toContain(
      `./value.${cjsExt}`,
    );
  },
);

test('CJS resolves renamed modules in require.resolve and declaration import assignments', async () => {
  const packageJson = { type: 'module' };
  const cwd = fixture({
    'package.json': packageJson,
    'src/index.js':
      "exports.value = require('./value').value; exports.filename = require.resolve('./value');",
    'src/index.d.ts': "import value = require('./value'); export { value };",
    'src/value.js': 'exports.value = 6;',
    'src/value.d.ts': 'export declare const value: 6;',
  });
  await builder({
    cwd,
    pkg: packageJson,
    userConfig: { cjs: { autoExtension: true } },
  });
  expect(read(cwd, 'dist/cjs/index.d.cts')).toContain('require("./value.cjs")');
  const result = execFileSync(
    process.execPath,
    [
      '-e',
      `const m = require('./dist/cjs/index.cjs'); console.log(m.value, m.filename.endsWith('value.cjs'));`,
    ],
    { cwd, encoding: 'utf-8' },
  );
  expect(result.trim()).toBe('6 true');
});
