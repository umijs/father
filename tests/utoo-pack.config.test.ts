import { JSMinifier } from '@umijs/bundler-webpack/dist/types';
import Joi from '@umijs/utils/compiled/@hapi/joi';
import { getUtooPackOptimization } from '../src/builder/bundle';
import type { IBundleConfig } from '../src/builder/config';
import { getSchemas } from '../src/features/configPlugins/schema';
import { IFatherBuildTypes } from '../src/types';

test('utoopack: passes optimization config through', () => {
  const config = {
    type: IFatherBuildTypes.BUNDLE,
    entry: 'src/index.ts',
    output: { path: 'dist', filename: 'index.min.js' },
    jsMinifier: JSMinifier.terser,
    concatenateModules: true,
    utoopack: {
      optimization: {
        compress: { passes: 3 },
        treeShaking: false,
      },
    },
  } satisfies IBundleConfig;

  expect(getUtooPackOptimization(config)).toEqual({
    compress: { passes: 3 },
    treeShaking: false,
    minify: true,
    concatenateModules: true,
  });
});

test('utoopack: accepts optimization config in father schema', () => {
  const schema = getSchemas().umd(Joi);
  const result = schema.validate({
    bundler: 'utoopack',
    utoopack: {
      optimization: {
        compress: { passes: 3 },
        treeShaking: false,
      },
    },
  });

  expect(result.error).toBeUndefined();
});
