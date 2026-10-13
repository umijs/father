import { JSMinifier } from '@umijs/bundler-webpack/dist/types';
import Joi from '@umijs/utils/compiled/@hapi/joi';
import fs from 'fs';
import os from 'os';
import path from 'path';
import bundle, { mergeUtooPackConfig } from '../src/builder/bundle';
import { getUtooPackCompatibility } from '../src/builder/bundle/utooCompat';
import { getSchemas } from '../src/features/configPlugins/schema';
import { IFatherBuildTypes } from '../src/types';

type IBundleConfig = import('../src/builder/config').IBundleConfig;
type BundleConfigProvider =
  import('../src/builder/config').BundleConfigProvider;

jest.mock('@utoo/pack', () => ({
  build: jest.fn().mockResolvedValue(undefined),
}));

let metadataRoot: string;
let metadataCwd: string;
beforeAll(() => {
  metadataRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'father-metadata-compat-'),
  );
  metadataCwd = path.join(metadataRoot, 'project');
  fs.mkdirSync(metadataCwd);
  fs.writeFileSync(
    path.join(metadataRoot, 'tsconfig.base.json'),
    JSON.stringify({
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
      },
    }),
  );
  fs.writeFileSync(
    path.join(metadataCwd, 'tsconfig.json'),
    JSON.stringify({ extends: '../tsconfig.base.json' }),
  );
});
afterAll(() => fs.rmSync(metadataRoot, { recursive: true, force: true }));

function getCompatibility(
  overrides: Partial<IBundleConfig> = {},
  development = false,
  cwd = path.resolve(__dirname, '..'),
) {
  return getUtooPackCompatibility(
    {
      type: IFatherBuildTypes.BUNDLE,
      entry: 'src/index.ts',
      output: { path: 'dist', filename: 'index.min.js' },
      jsMinifier: JSMinifier.terser,
      ...overrides,
    },
    { cwd, development },
  );
}

test('utoopack: preserves Father browser targets and excludes node builds', () => {
  expect(getCompatibility().target).toBe('ie 11');
  expect(getCompatibility({ targets: {} }).target).toBe('ie 11');
  expect(getCompatibility({ targets: { chrome: 80, ios: 12.1 } }).target).toBe(
    'chrome 80, ios_saf 12.1',
  );
  expect(
    getCompatibility({ platform: 'node', targets: { node: 18 } }).target,
  ).toBeUndefined();
  expect(getCompatibility({ platform: 'node' }).target).toBeUndefined();
});

test.each(['@emotion', '@emotion/babel-plugin'])(
  'utoopack: translates Emotion %s and enabled metadata without a second TS transform',
  (plugin) => {
    const config = getCompatibility(
      {
        extraBabelPlugins: [
          [plugin, { sourceMap: false, labelFormat: '[filename]--[local]' }],
          'babel-plugin-transform-typescript-metadata',
        ],
      },
      false,
      metadataCwd,
    );
    expect(config.styles?.emotion).toEqual({
      sourcemap: false,
      autoLabel: 'never',
      labelFormat: '[filename]--[local]',
    });
    expect(Object.keys(config.module?.rules || {}).sort()).toEqual([
      '*.cjs',
      '*.js',
      '*.jsx',
      '*.mjs',
    ]);
    expect(config.module?.rules?.['*.js']).toHaveProperty(
      'condition',
      'foreign',
    );
    expect(config.module?.rules?.['*.js']).toHaveProperty(
      'loaders.0.options.plugins',
      [
        [
          '@emotion/babel-plugin',
          {
            sourceMap: false,
            autoLabel: 'never',
            labelFormat: '[filename]--[local]',
          },
        ],
      ],
    );
  },
);

test('utoopack: rejects a metadata plugin when native compiler flags do not emit metadata', () => {
  for (const compilerOptions of [
    {},
    { experimentalDecorators: true, emitDecoratorMetadata: false },
    { experimentalDecorators: false, emitDecoratorMetadata: true },
  ]) {
    const cwd = fs.mkdtempSync(path.join(metadataRoot, 'disabled-'));
    fs.writeFileSync(
      path.join(cwd, 'tsconfig.json'),
      JSON.stringify({ compilerOptions }),
    );
    expect(() =>
      getCompatibility(
        { extraBabelPlugins: ['babel-plugin-transform-typescript-metadata'] },
        false,
        cwd,
      ),
    ).toThrow(/experimentalDecorators.*emitDecoratorMetadata.*webpack/);
  }
});

test('utoopack: metadata uses the nearest native jsconfig rather than an ancestor tsconfig', () => {
  const cwd = path.join(metadataCwd, 'child');
  fs.mkdirSync(cwd);
  fs.writeFileSync(
    path.join(cwd, 'jsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        experimentalDecorators: true,
        emitDecoratorMetadata: false,
      },
    }),
  );
  expect(() =>
    getCompatibility(
      { extraBabelPlugins: ['babel-plugin-transform-typescript-metadata'] },
      false,
      cwd,
    ),
  ).toThrow(/emitDecoratorMetadata/);
});

test('utoopack: rejects metadata flags inherited through a nested array extends', () => {
  const cwd = fs.mkdtempSync(path.join(metadataRoot, 'array-'));
  fs.writeFileSync(
    path.join(cwd, 'array-base.json'),
    JSON.stringify({ extends: ['../tsconfig.base.json'] }),
  );
  fs.writeFileSync(
    path.join(cwd, 'tsconfig.json'),
    JSON.stringify({ extends: './array-base.json' }),
  );
  expect(() =>
    getCompatibility(
      { extraBabelPlugins: ['babel-plugin-transform-typescript-metadata'] },
      false,
      cwd,
    ),
  ).toThrow(/array extends.*webpack/);
});

test('utoopack: resolves Emotion labels by mode and honors explicit labels', () => {
  expect(
    getCompatibility({ extraBabelPlugins: ['@emotion'] }, true).styles?.emotion,
  ).toEqual(expect.objectContaining({ autoLabel: 'always' }));
  expect(
    getCompatibility({
      extraBabelPlugins: [['@emotion', { autoLabel: 'always' }]],
    }).styles?.emotion,
  ).toEqual(expect.objectContaining({ autoLabel: 'always' }));
  expect(
    getCompatibility(
      { extraBabelPlugins: [['@emotion', { autoLabel: 'never' }]] },
      true,
    ).styles?.emotion,
  ).toEqual(expect.objectContaining({ autoLabel: 'never' }));
});

test('utoopack: preserves explicit native overrides and does not merge automatic loaders into user rules', () => {
  const overrides = {
    target: 'chrome 120',
    styles: { emotion: { sourcemap: true, autoLabel: 'always' as const } },
    module: { rules: { '*.js': { loaders: [] }, '*.jsx': ['custom-loader'] } },
  };
  const compatibility = getCompatibility({
    extraBabelPlugins: [['@emotion', { sourceMap: false }]],
    utoopack: overrides,
  });
  const config = mergeUtooPackConfig(
    {
      entry: [],
      ...compatibility,
      react: { runtime: 'automatic', importSource: 'react' },
    },
    overrides,
  );
  expect(config.target).toBe('chrome 120');
  expect(config.styles?.emotion).toEqual(overrides.styles.emotion);
  expect(config.react?.importSource).toBe('react');
  expect(config.module?.rules?.['*.js']).toEqual({ loaders: [] });
  expect(config.module?.rules?.['*.jsx']).toEqual(['custom-loader']);
  expect(config.module?.rules?.['*.mjs']).toHaveProperty(
    'loaders.0.options.plugins',
    [['@emotion/babel-plugin', { sourceMap: true, autoLabel: 'always' }]],
  );
  expect(
    getCompatibility({
      extraBabelPlugins: ['@emotion'],
      utoopack: { styles: { emotion: false } },
    }).module,
  ).toBeUndefined();
});

test('utoopack: does not silently ignore unsupported Babel configuration', () => {
  expect(
    getCompatibility({
      extraBabelPlugins: [false, null, undefined, ['@emotion', false]],
    }).styles,
  ).toBeUndefined();
  expect(() =>
    getCompatibility({ extraBabelPlugins: [['@emotion', null]] }),
  ).toThrow(/options.*object, false, or undefined/);
  expect(() =>
    getCompatibility({ extraBabelPlugins: ['babel-plugin-not-supported'] }),
  ).toThrow(/babel-plugin-not-supported.*webpack/);
  expect(() =>
    getCompatibility({
      extraBabelPlugins: [['@emotion', { cssPropOptimization: false }]],
    }),
  ).toThrow(/cssPropOptimization.*webpack/);
  expect(() =>
    getCompatibility({ extraBabelPresets: ['unsupported-preset'] }),
  ).toThrow(/extraBabelPresets.*webpack/);
});

test('utoopack: bundle wiring preserves the React JSX runtime when Emotion is enabled', async () => {
  const config: IBundleConfig = {
    type: IFatherBuildTypes.BUNDLE,
    bundler: 'utoopack',
    entry: 'src/index.ts',
    output: { path: 'dist', filename: 'index.min.js' },
    jsMinifier: JSMinifier.terser,
    extraBabelPlugins: ['@emotion'],
  };
  await bundle({
    cwd: path.resolve(__dirname, '..'),
    configProvider: {
      configs: [config],
      pkg: { dependencies: { react: '18.2.0' } },
    } as BundleConfigProvider,
  });
  const { build } = require('@utoo/pack');
  expect(build).toHaveBeenCalledWith(
    expect.objectContaining({
      config: expect.objectContaining({
        target: 'ie 11',
        react: { runtime: 'automatic', importSource: 'react' },
        styles: { emotion: { autoLabel: 'never' } },
      }),
    }),
    path.resolve(__dirname, '..'),
    undefined,
  );
});

test('utoopack: merges user config into father defaults', () => {
  const defaults = {
    entry: [],
    output: { path: 'dist', filename: 'index.min.js' },
    optimization: {
      minify: true,
      concatenateModules: true,
    },
    persistentCaching: false,
  } satisfies IBundleConfig['utoopack'] & { entry: [] };

  expect(
    mergeUtooPackConfig(defaults, {
      output: { publicPath: '/assets/' },
      optimization: {
        extractComments: true,
        compress: { passes: 3 },
      },
      stats: false,
    }),
  ).toEqual({
    entry: [],
    output: {
      path: 'dist',
      filename: 'index.min.js',
      publicPath: '/assets/',
    },
    optimization: {
      minify: true,
      concatenateModules: true,
      extractComments: true,
      compress: { passes: 3 },
    },
    persistentCaching: false,
    stats: false,
  });
});

test('utoopack: accepts config passthrough in father schema', () => {
  const schema = getSchemas().umd(Joi);
  const result = schema.validate({
    bundler: 'utoopack',
    utoopack: {
      optimization: {
        extractComments: true,
        compress: { passes: 3 },
        treeShaking: false,
      },
      stats: false,
    },
  });

  expect(result.error).toBeUndefined();
});
