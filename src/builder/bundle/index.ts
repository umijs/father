import type { webpack } from '@umijs/bundler-webpack';
import { chalk, importLazy, lodash } from '@umijs/utils';
import path from 'path';
import { CACHE_PATH } from '../../constants';
import type { BundleConfigProvider } from '../config';
import { getBabelPresetReactOpts, getBundleTargets } from '../utils';
import { logger } from '../../utils';
import { IBabelConfig, IBundlerWebpackConfig } from '../../types';

const bundler: typeof import('@umijs/bundler-webpack') = importLazy(
  path.dirname(require.resolve('@umijs/bundler-webpack/package.json')),
);
const {
  CSSMinifier,
  JSMinifier,
}: typeof import('@umijs/bundler-webpack/dist/types') = importLazy(
  require.resolve('@umijs/bundler-webpack/dist/types'),
);

export interface IBundleWatcher {
  close: () => void;
}

interface IBundlessOpts {
  cwd: string;
  configProvider: BundleConfigProvider;
  buildDependencies?: string[];
  watch?: boolean;
  babelPresetOpts: IBabelConfig['presetOpts'];
  extraBabelPresets: IBabelConfig['presets'];
  extraBabelPlugins: IBabelConfig['plugins'];
  chainWebpack?: IBundlerWebpackConfig['chainWebpack'];
}

function bundless(opts: Omit<IBundlessOpts, 'watch'>): Promise<void>;
function bundless(opts: IBundlessOpts): Promise<IBundleWatcher>;
async function bundless(opts: IBundlessOpts): Promise<void | IBundleWatcher> {
  const enableCache = process.env.FATHER_CACHE !== 'none';
  const closeHandlers: webpack.Watching['close'][] = [];

  for (const config of opts.configProvider.configs) {
    const { plugins: extraPostCSSPlugins, ...postcssLoader } =
      config.postcssOptions || {};
    // workaround for combine continuous onBuildComplete log in watch mode
    const logStatus = lodash.debounce(
      () =>
        logger.info(
          `Bundle from ${chalk.yellow(config.entry)} to ${chalk.yellow(
            path.join(config.output.path, config.output.filename),
          )}`,
        ),
      100,
      { leading: true, trailing: false },
    );

    // log for normal build
    !opts.watch && logStatus();
    await bundler.build({
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
          presetReact: getBabelPresetReactOpts(
            opts.configProvider.pkg,
            opts.cwd,
          ),
          presetTypeScript: {},
          pluginTransformRuntime: {},
          pluginLockCoreJS: {},
          pluginDynamicImportNode: false,
          ...opts.babelPresetOpts,
        },
      ],
      beforeBabelPlugins: [require.resolve('babel-plugin-dynamic-import-node')],
      extraBabelPresets: [
        ...(opts.extraBabelPresets || []),
        ...(config.extraBabelPresets || []),
      ],
      extraBabelPlugins: [
        ...(opts.extraBabelPlugins || []),
        ...(config.extraBabelPlugins || []),
      ],

      // configure library related options
      chainWebpack(memo: any, args: any) {
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

        opts.chainWebpack && opts.chainWebpack(memo, { ...args, config });

        return memo;
      },

      // enable webpack persistent cache
      ...(enableCache
        ? {
            cache: {
              buildDependencies: opts.buildDependencies,
              cacheDirectory: path.join(opts.cwd, CACHE_PATH, 'bundle-webpack'),
            },
          }
        : {}),

      // collect close handlers for watch mode
      ...(opts.watch
        ? {
            onBuildComplete({ isFirstCompile, close }: any) {
              if (isFirstCompile) closeHandlers.push(close);
              // log for watch mode
              else logStatus();
            },
          }
        : {}),
    });
  }

  // return watching closer for watch mode
  if (opts.watch) {
    return {
      close() {
        return Promise.all(
          closeHandlers.map(
            (handler) => new Promise((resolve) => handler(resolve)),
          ),
        );
      },
    };
  }
}

export default bundless;
