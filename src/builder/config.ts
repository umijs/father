import path from 'path';
import { winPath } from '@umijs/utils';
import type { IBundlerConfig } from './executor/bundle';
import type { ITransformerConfig } from './executor/bundless';
import type { IFatherConfig } from '../types';

const DEFAULT_BUNDLESS_IGNORES = [
  '**/*.md',
  '**/__{test,tests}__/**',
  '**/*.{test,e2e,spec}.{js,jsx,ts,tsx}',
];

/**
 * declare union builder config
 */
export type IBuilderConfig = IBundlerConfig | ITransformerConfig;

/**
 * normalize user config to bundler configs
 * @param userConfig  config from user
 */
export function normalizeUserConfig(
  userConfig: IFatherConfig,
  opts: { cwd: string },
) {
  const configs: IBuilderConfig[] = [];
  const { umd, esm, ...baseConfig } = userConfig;

  // normalize umd config
  if (umd) {
    const entryConfig = umd.entry;
    const bundleConfig: Omit<IBundlerConfig, 'entry'> = {
      type: 'bundle',
      bundler: 'webpack',

      // default to output dist
      output: 'dist',
      ...baseConfig,

      // override base configs from umd config
      ...umd,
    };

    if (typeof entryConfig === 'object') {
      // extract multiple entries to single configs
      Object.keys(entryConfig).forEach((entry) => {
        configs.push({
          ...bundleConfig,

          // override all configs from entry config
          ...entryConfig[entry],
          entry,
        });
      });
    } else {
      // generate single entry to single config
      configs.push({
        ...bundleConfig,

        // default to bundle src/index
        entry: entryConfig || 'src/index',
      });
    }
  }

  // normalize esm config
  if (esm) {
    const { overrides = {}, input, ...esmBaseConfig } = esm;
    const autoTransformer = userConfig.targets?.node ? 'esbuild' : 'babel';
    const bundlessConfig: Omit<ITransformerConfig, 'input'> = {
      type: 'bundless',
      output: 'es',

      // default to use auto transformer
      transformer: autoTransformer,
      ...baseConfig,
      ...esmBaseConfig,
    };

    // generate config for input
    configs.push({
      ...bundlessConfig,

      // default to transform src
      input: esm.input || 'src',

      // transform overrides inputs to ignores
      ignores: DEFAULT_BUNDLESS_IGNORES.concat(
        Object.keys(overrides).map((i) => `${i}/*`),
      ),
    });

    // generate config for overrides
    Object.keys(overrides).forEach((oInput) => {
      configs.push({
        ...bundlessConfig,

        // override all configs for different input
        ...overrides[oInput],

        // specific different input
        input: oInput,

        // transform another child overides to ignores
        // for support to transform src/a and src/a/child with different configs
        ignores: DEFAULT_BUNDLESS_IGNORES.concat(
          Object.keys(overrides)
            .filter((i) => i.startsWith(oInput))
            .map((i) => `${i}/*`),
        ),
      });
    });
  }

  // transform relative path to absolute path for all configs
  configs.forEach((config) => {
    if (config.type === 'bundle') {
      config.entry = winPath(path.resolve(opts.cwd, config.entry));
    } else if (config.type === 'bundless') {
      config.input = winPath(path.resolve(opts.cwd, config.input));
    }

    config.output = winPath(path.resolve(opts.cwd, config.output!));
  });

  return configs;
}
