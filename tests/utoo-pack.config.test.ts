import Joi from '@umijs/utils/compiled/@hapi/joi';
import { mergeUtooPackConfig } from '../src/builder/bundle';
import type { IBundleConfig } from '../src/builder/config';
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
