import { winPath } from '@umijs/utils';
import { Minimatch } from 'minimatch';
import path from 'path';
import { loadConfig } from 'tsconfig-paths';
import * as MappingEntry from 'tsconfig-paths/lib/mapping-entry';
import {
  IApi,
  IFatherBaseConfig,
  IFatherBuildTypes,
  IFatherBundleConfig,
  IFatherBundlessConfig,
  IFatherBundlessTypes,
  IFatherConfig,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../types';
import { logger } from '../utils';

/**
 * declare bundler config
 */
export interface IBundleConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundleConfig, 'entry' | 'output'> {
  type: IFatherBuildTypes.BUNDLE;
  bundler: 'webpack';
  entry: string;
  output: {
    filename: string;
    path: string;
  };
}

/**
 * declare bundless config
 */
export interface IBundlessConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundlessConfig, 'input' | 'overrides'> {
  type: IFatherBuildTypes.BUNDLESS;
  format: IFatherBundlessTypes;
  input: string;
  output: NonNullable<IFatherBundlessConfig['output']>;
}

/**
 * declare union builder config
 */
export type IBuilderConfig = IBundleConfig | IBundlessConfig;

/**
 * generate bundle filename by package name
 */
function getAutoBundleFilename(pkgName?: string) {
  return pkgName ? pkgName.replace(/^@[^/]+\//, '') : 'index';
}

/**
 *
 * convert alias from tsconfig paths
 * @export
 * @param {string} cwd
 */
export function convertAliasByTsconfigPaths(cwd: string) {
  const config = loadConfig(cwd);
  const bundle: Record<string, string> = {};
  const bundless: typeof bundle = {};

  if (config.resultType === 'success') {
    const { absoluteBaseUrl, paths } = config;

    let absolutePaths = MappingEntry.getAbsoluteMappingEntries(
      absoluteBaseUrl,
      paths,
      true,
    );

    absolutePaths.forEach((entry) => {
      if (entry.pattern === '*') return;

      const [physicalPathPattern] = entry.paths;
      const name = entry.pattern.replace(/\/\*$/, '');
      const target = winPath(physicalPathPattern).replace(/\/\*$/, '');

      bundle[name] = target;

      // for bundless, only convert paths which within cwd
      if (target.startsWith(`${winPath(cwd)}/`)) {
        bundless[name] = target;
      }
    });
  }

  return { bundle, bundless };
}

/**
 * normalize user config to bundler configs
 * @param userConfig  config from user
 */
export function normalizeUserConfig(
  userConfig: IFatherConfig,
  pkg: IApi['pkg'],
) {
  const configs: IBuilderConfig[] = [];
  const { umd, esm, cjs, ...baseConfig } = userConfig;

  // normalize umd config
  if (umd) {
    const entryConfig = umd.entry;
    const output =
      typeof umd.output === 'object' ? umd.output : { path: umd.output };
    const bundleConfig: Omit<IBundleConfig, 'entry'> = {
      type: IFatherBuildTypes.BUNDLE,
      bundler: 'webpack',
      ...baseConfig,

      // override base configs from umd config
      ...umd,

      // generate default output
      output: {
        // default to generate filename from package name
        filename:
          output.filename || `${getAutoBundleFilename(pkg.name)}.min.js`,
        // default to output dist
        path: output.path || 'dist/umd',
      },
    };

    if (typeof entryConfig === 'object') {
      // extract multiple entries to single configs
      Object.keys(entryConfig).forEach((entry) => {
        const outputConfig = entryConfig[entry].output;
        const entryOutput =
          typeof outputConfig === 'object'
            ? outputConfig
            : { path: outputConfig };

        configs.push({
          ...bundleConfig,

          // override all configs from entry config
          ...entryConfig[entry],
          entry,

          // override output
          output: {
            filename:
              entryOutput.filename || `${path.parse(entry).name}.min.js`,
            path: entryOutput.path || bundleConfig.output.path,
          },
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
  Object.entries({
    ...(esm ? { esm } : {}),
    ...(cjs ? { cjs } : {}),
  }).forEach(([formatName, formatConfig]) => {
    const { overrides = {}, ...esmBaseConfig } = formatConfig;
    const defaultPlatform =
      formatName === 'esm'
        ? IFatherPlatformTypes.BROWSER
        : IFatherPlatformTypes.NODE;
    const bundlessConfig: Omit<IBundlessConfig, 'input' | 'output'> = {
      type: IFatherBuildTypes.BUNDLESS,
      format: formatName as IFatherBundlessTypes,
      platform: userConfig.platform || defaultPlatform,
      ...baseConfig,
      ...esmBaseConfig,
    };

    // generate config for input
    const rootConfig = {
      // default to transform src
      input: 'src',

      // default to output to dist
      output: `dist/${formatName}`,

      // default to use auto transformer
      transformer:
        bundlessConfig.platform === IFatherPlatformTypes.NODE
          ? IFatherJSTransformerTypes.ESBUILD
          : IFatherJSTransformerTypes.BABEL,

      ...bundlessConfig,

      // transform overrides inputs to ignores
      ignores: Object.keys(overrides)
        .map((i) => `${i}/**`)
        .concat(bundlessConfig.ignores || []),
    };
    configs.push(rootConfig);

    // generate config for overrides
    Object.keys(overrides).forEach((oInput) => {
      const overridePlatform =
        overrides[oInput].platform || bundlessConfig.platform;

      // validate override input
      if (!oInput.startsWith(`${rootConfig.input}/`)) {
        throw new Error(
          `Override input ${oInput} must be a subpath of ${formatName}.input!`,
        );
      }

      configs.push({
        // default to use auto transformer
        transformer:
          overridePlatform === IFatherPlatformTypes.NODE
            ? IFatherJSTransformerTypes.ESBUILD
            : IFatherJSTransformerTypes.BABEL,

        // default to output relative root config
        output: `${rootConfig.output}/${winPath(
          path.relative(rootConfig.input, oInput),
        )}`,

        ...bundlessConfig,

        // override all configs for different input
        ...overrides[oInput],

        // specific different input
        input: oInput,

        // transform another child overrides to ignores
        // for support to transform src/a and src/a/child with different configs
        ignores: Object.keys(overrides)
          .filter((i) => i.startsWith(oInput) && i !== oInput)
          .map((i) => `${i}/**`)
          .concat(bundlessConfig.ignores || []),
      });
    });
  });

  return configs;
}

class Minimatcher {
  matcher?: InstanceType<typeof Minimatch>;

  ignoreMatchers: InstanceType<typeof Minimatch>[] = [];

  constructor(pattern: string, ignores: string[] = []) {
    this.matcher = new Minimatch(`${pattern}/**`);
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
    let flag = false;

    // check input match
    if (this.matcher!.match(filePath)) {
      flag = true;

      for (const m of this.ignoreMatchers) {
        // mark flag false if filePath match ignore matcher
        if (m.match(filePath)) {
          flag = false;

          // stop check if current ignore glob not start with "!"
          // but for the negate glob, we should continue to find other negate glob which exclude current filePath
          if (!m.negate) break;
        } else if (m.negate) {
          // stop check and mark flag true, if some negate glob exclude current filePath
          flag = true;
          break;
        }
      }
    }

    return flag;
  }
}

class ConfigProvider {
  pkg: ConstructorParameters<typeof ConfigProvider>[0];

  constructor(pkg: IApi['pkg']) {
    this.pkg = pkg;
  }

  onConfigChange() {
    // not implemented
  }
}

export class BundleConfigProvider extends ConfigProvider {
  type = IFatherBuildTypes.BUNDLE;

  configs: IBundleConfig[] = [];

  constructor(
    configs: IBundleConfig[],
    pkg: ConstructorParameters<typeof ConfigProvider>[0],
  ) {
    super(pkg);
    this.configs = configs;
  }
}

export class BundlessConfigProvider extends ConfigProvider {
  type = IFatherBuildTypes.BUNDLESS;

  configs: IBundlessConfig[] = [];

  input = '';

  output = '';

  matchers: InstanceType<typeof Minimatcher>[] = [];

  constructor(
    configs: IBundlessConfig[],
    pkg: ConstructorParameters<typeof ConfigProvider>[0],
  ) {
    super(pkg);
    this.configs = configs;
    this.input = configs[0].input;
    this.output = configs[0].output!;
    configs.forEach((config) => {
      this.matchers.push(new Minimatcher(config.input, config.ignores));
    });
  }

  // TODO 这里匹配有问题，会先匹配到全局的，例如 src/async 会被 src/** 匹配到
  getConfigForFile(filePath: string) {
    return this.configs[this.matchers.findIndex((m) => m.match(filePath))];
  }
}

export function createConfigProviders(
  userConfig: IFatherConfig,
  pkg: IApi['pkg'],
  cwd: string,
) {
  const providers: {
    bundless: { esm?: BundlessConfigProvider; cjs?: BundlessConfigProvider };
    bundle?: BundleConfigProvider;
  } = { bundless: {} };
  const configs = normalizeUserConfig(userConfig, pkg);

  // convert alias from tsconfig paths
  const aliasFromPaths = convertAliasByTsconfigPaths(cwd);
  logger.debug('Convert alias from tsconfig.json:', aliasFromPaths);

  const { bundle, bundless } = configs.reduce(
    (r, config) => {
      if (config.type === IFatherBuildTypes.BUNDLE) {
        config.alias = { ...aliasFromPaths.bundle, ...config.alias };
        r.bundle.push(config);
      } else if (config.type === IFatherBuildTypes.BUNDLESS) {
        config.alias = { ...aliasFromPaths.bundless, ...config.alias };
        // Handling file suffixes only bundless mode needs to be handled
        for (let target in config.alias) {
          // If the file suffix is js remove the suffix
          const aPath = config.alias[target];
          config.alias![target] = aPath.replace(/\.(t|j)sx?$/, '');
        }

        r.bundless[config.format].push(config);
      }

      return r;
    },
    { bundle: [], bundless: { esm: [], cjs: [] } } as {
      bundle: IBundleConfig[];
      bundless: { esm: IBundlessConfig[]; cjs: IBundlessConfig[] };
    },
  );

  if (bundle.length) {
    providers.bundle = new BundleConfigProvider(bundle, pkg);
  }

  if (bundless.cjs.length) {
    providers.bundless.cjs = new BundlessConfigProvider(bundless.cjs, pkg);
  }

  if (bundless.esm.length) {
    providers.bundless.esm = new BundlessConfigProvider(bundless.esm, pkg);
  }

  return providers;
}
