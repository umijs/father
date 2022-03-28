import { winPath } from '@umijs/utils';
import fs from 'fs';
import { Minimatch } from 'minimatch';
import path from 'path';
import {
  IFatherBaseConfig,
  IFatherBuildTypes,
  IFatherBundleConfig,
  IFatherBundlessConfig,
  IFatherConfig,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../types';

/**
 * declare bundler config
 */
export interface IBundleConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundleConfig, 'entry'> {
  type: IFatherBuildTypes.BUNDLE;
  bundler: 'webpack';
  entry: string;
}

/**
 * declare bundless config
 */
export interface IBundlessConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundlessConfig, 'input' | 'overrides'> {
  type: IFatherBuildTypes.BUNDLESS;
  input: string;
}

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
      ignores: Object.keys(overrides).map((i) => `${i}/*`),
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
        ignores: Object.keys(overrides)
          .filter((i) => i.startsWith(oInput))
          .map((i) => `${i}/*`),
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

class Minimatcher {
  matcher?: InstanceType<typeof Minimatch>;

  ignoreMatchers: InstanceType<typeof Minimatch>[] = [];

  constructor(pattern: string, ignores: string[] = []) {
    this.matcher = new Minimatch(
      fs.lstatSync(pattern).isDirectory() ? `${pattern}/**` : pattern,
    );
    ignores.forEach((i) => {
      this.ignoreMatchers.push(new Minimatch(i, { dot: true }));

      // see also: https://github.com/isaacs/node-glob/blob/main/common.js#L37
      if (i.slice(-3) === '/**') {
        this.ignoreMatchers.push(
          new Minimatch(i.replace(/(\/\*\*)+$/, ''), { dot: true }),
        );
      }
    });
  }

  match(filePath: string) {
    return (
      this.matcher!.match(filePath) &&
      this.ignoreMatchers.every((m) => !m.match(filePath))
    );
  }
}

class ConfigProvider {
  onConfigChange() {
    // not implemented
  }
}

export class BundleConfigProvider extends ConfigProvider {
  type = IFatherBuildTypes.BUNDLE;

  configs: IBundleConfig[] = [];

  constructor(configs: IBundleConfig[]) {
    super();
    this.configs = configs;
  }
}

export class BundlessConfigProvider extends ConfigProvider {
  type = IFatherBuildTypes.BUNDLESS;

  configs: IBundlessConfig[] = [];

  input = '';

  output = '';

  matchers: InstanceType<typeof Minimatcher>[] = [];

  constructor(configs: IBundlessConfig[]) {
    super();

    this.configs = configs;
    this.input = configs[0].input;
    this.output = configs[0].output!;
    configs.forEach((config) => {
      this.matchers.push(new Minimatcher(config.input, config.ignores));
    });
  }

  getConfigForPath(file: string) {
    return this.configs[this.matchers.findIndex((m) => m.match(file))];
  }
}

export function createConfigProviders(
  userConfig: IFatherConfig,
  opts: { cwd: string },
) {
  const providers: {
    bundless?: BundlessConfigProvider;
    bundle?: BundleConfigProvider;
  } = {};
  const configs = normalizeUserConfig(userConfig, opts);
  const { bundle, bundless } = configs.reduce(
    (r, config) => {
      if (config.type === IFatherBuildTypes.BUNDLE) {
        r.bundle.push(config);
      } else if (config.type === IFatherBuildTypes.BUNDLESS) {
        r.bundless.push(config);
      }

      return r;
    },
    { bundle: [], bundless: [] } as {
      bundle: IBundleConfig[];
      bundless: IBundlessConfig[];
    },
  );

  if (bundle.length) {
    providers.bundle = new BundleConfigProvider(bundle);
  }

  if (bundless.length) {
    providers.bundless = new BundlessConfigProvider(bundless);
  }

  return providers;
}
