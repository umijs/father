import Joi from '@umijs/utils/compiled/@hapi/joi';
import { mergeUtooPackConfig } from '../src/builder/bundle';
import type { IBundleConfig } from '../src/builder/config';
import { convertExternalsToUtooPackExternals } from '../src/builder/utils';
import { getSchemas } from '../src/features/configPlugins/schema';

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

describe('utoopack UMD externals', () => {
  test('preserves the external request name for CommonJS and browser consumers', () => {
    expect(
      convertExternalsToUtooPackExternals({
        react: 'React',
        'react-dom': 'ReactDOM',
      }),
    ).toEqual({
      react: { root: 'React', commonjs: 'React' },
      'react-dom': { root: 'ReactDOM', commonjs: 'ReactDOM' },
    });
  });

  test('supports a single module name', () => {
    expect(convertExternalsToUtooPackExternals('react')).toEqual({
      react: { root: 'react', commonjs: 'react' },
    });
  });

  test('supports mixed arrays without dropping UMD semantics', () => {
    expect(
      convertExternalsToUtooPackExternals([
        'react',
        { 'react-dom': 'ReactDOM' },
      ]),
    ).toEqual({
      react: { root: 'react', commonjs: 'react' },
      'react-dom': { root: 'ReactDOM', commonjs: 'ReactDOM' },
    });
  });

  test.each([
    'commonjs React',
    'commonjs2 React',
    'module react',
    'esm react',
    'global React',
    'var React',
    'window React',
    'promise Promise.resolve(React)',
    'script React@https://example.com/react.js',
  ])('preserves an explicitly typed external: %s', (external) => {
    expect(convertExternalsToUtooPackExternals({ react: external })).toEqual({
      react: external,
    });
  });

  test('preserves explicit objects and script shorthand', () => {
    const externals = {
      react: { root: 'React', commonjs: 'react', commonjs2: 'react' },
      jquery: { root: 'jQuery', type: 'global' },
    };
    expect(convertExternalsToUtooPackExternals(externals)).toEqual(externals);
    expect(
      convertExternalsToUtooPackExternals({
        react: 'React@https://example.com/react.js',
      }),
    ).toEqual({ react: 'script React@https://example.com/react.js' });
  });

  test.each(['', 'React .Component', 'React\t.Component'])(
    'leaves empty and whitespace-containing values unchanged: %j',
    (external) => {
      expect(convertExternalsToUtooPackExternals({ react: external })).toEqual({
        react: external,
      });
    },
  );

  test('keeps absent externals absent', () => {
    expect(convertExternalsToUtooPackExternals()).toBeUndefined();
  });
});
