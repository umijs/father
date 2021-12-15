import path from 'path';
import { winPath } from '@umijs/utils';
import {
  IFatherBuildTypes,
  IFatherConfig,
  IFatherPlatformTypes,
  IFatherJSTransformerTypes,
} from '../types';
import type { IBundleConfig } from './bundle';
import type { IBundlessConfig } from './bundless';

const DEFAULT_BUNDLESS_IGNORES = [
  '**/*.md',
  '**/__{test,tests}__/**',
  '**/*.{test,e2e,spec}.{js,jsx,ts,tsx}',
];

/**
 * declare union builder config
 */
export type IBuilderConfig = IBundleConfig | IBundlessConfig;

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
    const bundleConfig: Omit<IBundleConfig, 'entry'> = {
      type: IFatherBuildTypes.BUNDLE,
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
    const { overrides = {}, ...esmBaseConfig } = esm;
    const bundlessPlatform = esmBaseConfig.platform || userConfig.platform;
    const bundlessConfig: Omit<IBundlessConfig, 'input'> = {
      type: IFatherBuildTypes.BUNDLESS,
      ...baseConfig,
      ...esmBaseConfig,
    };

    // generate config for input
    configs.push({
      // default to transform src
      input: 'src',

      // default to output to dist
      output: 'dist',

      // default to use auto transformer
      transformer:
        bundlessPlatform === IFatherPlatformTypes.NODE
          ? IFatherJSTransformerTypes.ESBUILD
          : IFatherJSTransformerTypes.BABEL,

      ...bundlessConfig,

      // transform overrides inputs to ignores
      ignores: DEFAULT_BUNDLESS_IGNORES.concat(
        Object.keys(overrides).map((i) => `${i}/*`),
      ),
    });

    // generate config for overrides
    Object.keys(overrides).forEach((oInput) => {
      const overridePlatform = overrides[oInput].platform || bundlessPlatform;

      configs.push({
        // default to use auto transformer
        transformer:
          overridePlatform === IFatherPlatformTypes.NODE
            ? IFatherJSTransformerTypes.ESBUILD
            : IFatherJSTransformerTypes.BABEL,

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
    if (config.type === IFatherBuildTypes.BUNDLE) {
      config.entry = winPath(path.resolve(opts.cwd, config.entry));
    } else if (config.type === IFatherBuildTypes.BUNDLESS) {
      config.input = winPath(path.resolve(opts.cwd, config.input));
    }

    config.output = winPath(path.resolve(opts.cwd, config.output!));
  });

  return configs;
}
