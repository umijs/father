import { tryPaths } from '@umijs/utils';
import { join, parse } from 'path';
import { getCachePath } from '../../utils';
import type { BundleConfigProvider, IBundleConfig } from '../config';
import { getBabelPresetReactOpts, getBundleTargets } from '../utils';
import { logStatus } from './utils';

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'];

interface IBundleOpts {
  cwd: string;
  configProvider: BundleConfigProvider;
  buildDependencies?: string[];
  watch?: boolean;
}

async function makoBundle(
  opts: IBundleOpts,
  config: IBundleConfig,
): Promise<void> {
  // log for normal build
  logStatus(config);
  require('@umijs/bundler-webpack/dist/requireHook');
  // @ts-ignore
  const { build, dev } = require(process.env.OKAM);
  // mako need extension
  const entry = tryPaths(
    extensions.map((ext) => join(opts.cwd, `${config.entry}${ext}`)),
  );
  const options = {
    cwd: opts.cwd,
    config: {
      alias: config.alias,
      autoprefixer: config.autoprefixer,
      chainWebpack: config.chainWebpack,
      define: config.define,
      devtool: config.sourcemap && 'source-map',
      externals: config.externals || {},
      outputPath: config.output.path,
      ...(config.extractCSS !== false ? {} : { styleLoader: {} }),

      // less config
      theme: config.theme,

      // compatible with IE11 by default
      targets: getBundleTargets(config),
      extraBabelIncludes: [/node_modules/],

      // set cache parent directory, will join it with `bundler-webpack`
      // ref: https://github.com/umijs/umi/blob/8dad8c5af0197cd62db11f4b4c85d6bc1db57db1/packages/bundler-webpack/src/build.ts#L32
      cacheDirectoryPath: getCachePath(),
    },
    entry: {
      [parse(config.output.filename).name]: entry,
    },
    babelPreset: [
      require.resolve('@umijs/babel-preset-umi'),
      {
        presetEnv: {
          targets: getBundleTargets(config),
        },
        presetReact: getBabelPresetReactOpts(opts.configProvider.pkg, opts.cwd),
        presetTypeScript: {},
        pluginTransformRuntime: {},
        pluginLockCoreJS: {},
        pluginDynamicImportNode: false,
      },
    ],

    // configure library related options
    chainWebpack(memo: any) {
      memo.output.libraryTarget('umd');

      if (config?.name) {
        memo.output.library(config.name);
      }

      // modify webpack target
      if (config.platform === 'node') {
        memo.target('node');
      }
      return memo;
    },
    disableCopy: true,
    onBuildComplete({ isFirstCompile }: any) {
      if (!isFirstCompile) logStatus(config);
    },
  };

  if (opts.watch) {
    return await dev(options);
  }
  return await build(options);
}

export default makoBundle;
