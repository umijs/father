import type { webpack } from '@umijs/bundler-webpack';
import { importLazy } from '@umijs/utils';
import path from 'path';
import { getCachePath } from '../../utils';
import type { BundleConfigProvider, IBundleConfig } from '../config';
import {
  getBabelPresetReactOpts,
  getBabelStyledComponentsOpts,
  getBundleTargets,
} from '../utils';
import { logStatus } from './utils';
const bundler: typeof import('@umijs/bundler-webpack') = importLazy(
  path.dirname(require.resolve('@umijs/bundler-webpack/package.json')),
);
const {
  CSSMinifier,
  JSMinifier,
}: typeof import('@umijs/bundler-webpack/dist/types') = importLazy(
  require.resolve('@umijs/bundler-webpack/dist/types'),
);

interface IBundleOpts {
  cwd: string;
  configProvider: BundleConfigProvider;
  buildDependencies?: string[];
  watch?: boolean;
}

let i = 0;

async function webpackBundle(
  opts: IBundleOpts,
  config: IBundleConfig,
  closeHandlers: webpack.Watching['close'][] = [],
): Promise<webpack.Stats> {
  const enableCache = process.env.FATHER_CACHE !== 'none';
  const babelSCOpts = getBabelStyledComponentsOpts(opts.configProvider.pkg);
  const { plugins: extraPostCSSPlugins, ...postcssLoader } =
    config.postcssOptions || {};

  // log for normal build
  !opts.watch && logStatus(config);
  return await bundler.build({
    cwd: opts.cwd,
    watch: opts.watch,
    config: {
      alias: config.alias,
      autoprefixer: config.autoprefixer,
      chainWebpack: config.chainWebpack,
      define: config.define,
      devtool: config.sourcemap && 'source-map',
      externals: config.externals,
      outputPath: config.output.path,

      // postcss config
      extraPostCSSPlugins,
      postcssLoader,

      ...(config.extractCSS !== false ? {} : { styleLoader: {} }),

      // less config
      theme: config.theme,

      // compatible with IE11 by default
      targets: getBundleTargets(config),
      jsMinifier: JSMinifier.terser,
      cssMinifier: CSSMinifier.cssnano,
      extraBabelIncludes: [/node_modules/],

      // set cache parent directory, will join it with `bundler-webpack`
      // ref: https://github.com/umijs/umi/blob/8dad8c5af0197cd62db11f4b4c85d6bc1db57db1/packages/bundler-webpack/src/build.ts#L32
      cacheDirectoryPath: getCachePath(),
    },
    entry: {
      [path.parse(config.output.filename).name]: path.join(
        opts.cwd,
        config.entry,
      ),
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
    beforeBabelPlugins: [
      require.resolve('babel-plugin-dynamic-import-node'),
      ...(babelSCOpts
        ? [[require.resolve('babel-plugin-styled-components'), babelSCOpts]]
        : []),
    ],
    extraBabelPresets: config.extraBabelPresets,
    extraBabelPlugins: config.extraBabelPlugins,

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

      if (enableCache) {
        // use father version as cache version
        memo.merge({
          cache: { version: require('../../../package.json').version },
        });
      }

      // also bundle svg as asset, because father force disable svgr
      const imgRule = memo.module.rule('asset').oneOf('image');

      imgRule.test(
        new RegExp(imgRule.get('test').source.replace(/(\|png)/, '$1|svg')),
      );

      // disable progress bar
      memo.plugins.delete('progress-plugin');

      // auto bump analyze port
      /* istanbul ignore if -- @preserve */
      if (process.env.ANALYZE) {
        memo.plugin('webpack-bundle-analyzer').tap((args: any) => {
          args[0].analyzerPort += i;

          return args;
        });
      }

      return memo;
    },

    // enable webpack persistent cache
    ...(enableCache
      ? {
          cache: {
            buildDependencies: opts.buildDependencies,
          },
        }
      : {}),

    // collect close handlers for watch mode
    ...(opts.watch
      ? {
          onBuildComplete({ isFirstCompile, close }: any) {
            if (isFirstCompile) closeHandlers.push(close);
            // log for watch mode
            else logStatus(config);
          },
        }
      : {}),
    disableCopy: true,
  });
}

export default webpackBundle;
