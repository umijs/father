import type { webpack } from '@umijs/bundler-webpack';
import { chalk, importLazy, lodash } from '@umijs/utils';
import type { BundleOptions } from '@utoo/pack';
import path from 'path';
import { getCachePath, logger } from '../../utils';
import type { BundleConfigProvider } from '../config';
import {
  convertCopyConfig,
  convertExternalsToUtooPackExternals,
  getBabelPresetReactOpts,
  getBabelStyledComponentsOpts,
  getBundleTargets,
} from '../utils';

const webpackBundler: typeof import('@umijs/bundler-webpack') = importLazy(
  path.dirname(require.resolve('@umijs/bundler-webpack/package.json')),
);

const utooPackBundler: typeof import('@utoo/pack') = importLazy(
  path.dirname(require.resolve('@utoo/pack/package.json')),
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

interface IBundleOpts {
  cwd: string;
  configProvider: BundleConfigProvider;
  buildDependencies?: string[];
  watch?: boolean;
  incremental?: boolean;
}

function bundle(
  opts: Omit<IBundleOpts, 'watch' | 'incremental'>,
): Promise<void>;
function bundle(opts: IBundleOpts): Promise<IBundleWatcher>;
async function bundle(opts: IBundleOpts): Promise<void | IBundleWatcher> {
  const enableCache = process.env.FATHER_CACHE !== 'none';
  const closeHandlers: webpack.Watching['close'][] = [];

  if (!opts.incremental) {
    for (let i = 0; i < opts.configProvider.configs.length; i += 1) {
      const config = opts.configProvider.configs[i];
      const { plugins: extraPostCSSPlugins, ...postcssLoader } =
        config.postcssOptions || {};
      const babelSCOpts = getBabelStyledComponentsOpts(opts.configProvider.pkg);
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
      const webpackBundlerOpts = {
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
          jsMinifier: config.jsMinifier || JSMinifier.terser,
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
            presetReact: getBabelPresetReactOpts(
              opts.configProvider.pkg,
              opts.cwd,
            ),
            presetTypeScript: {},
            pluginTransformRuntime: config.transformRuntime || {},
            pluginLockCoreJS: {},
            pluginDynamicImportNode: false,
          },
        ],
        beforeBabelPlugins: [
          ...(babelSCOpts
            ? [[require.resolve('babel-plugin-styled-components'), babelSCOpts]]
            : []),
        ],
        extraBabelPresets: config.extraBabelPresets,
        extraBabelPlugins: config.extraBabelPlugins,

        // configure library related options
        chainWebpack(memo: any) {
          memo.output.libraryTarget('umd');
          memo.merge({
            output: {
              asyncChunks: false,
            },
          });
          if (config?.name) {
            memo.output.library(config.name);
          }

          // modify webpack target and disable browser polyfills for node platform
          if (config.platform === 'node') {
            memo.target('node');
            // Remove browser polyfills for process/Buffer that are injected by
            // @umijs/bundler-webpack's addNodePolyfill, as they override Node.js
            // built-ins with browser shims, breaking CLI tools that rely on
            // process.argv, process.exit, etc.
            memo.plugins.delete('node-polyfill-provider');
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
                else logStatus();
              },
            }
          : {}),
        disableCopy: true,
      };
      if (config.bundler === 'utoopack') {
        const entryName = path.parse(config.output.filename).name;
        const distPath = config.output.path;
        const externals = convertExternalsToUtooPackExternals(config.externals);
        const copy = convertCopyConfig(config.copy, distPath);
        const utooPackOpts: BundleOptions = {
          config: {
            entry: [
              {
                name: entryName,
                import: path.join(opts.cwd, config.entry),
                // set umd config.
                library: {
                  name: config.name,
                  export: [],
                },
              },
            ],
            mode: opts.watch ? 'development' : 'production',
            resolve: {
              alias: config.alias,
            },
            sourceMaps: Boolean(config.sourcemap),
            externals,
            define: config.define,
            styles: {
              inlineCss: {},
            },
            output: {
              path: distPath,
              filename: config.output.filename,
              copy,
            },
            optimization: {
              minify: config.jsMinifier !== JSMinifier.none,
              concatenateModules: config.concatenateModules,
            },
          },
          defineEnv: {
            client: [],
            nodejs: [],
            edge: [],
          },
          processEnv: {},
          watch: {
            enable: opts.watch ?? false,
          },
          dev: opts.watch ?? false,
          buildId: '',
        };
        const projectPath = opts.cwd;
        const rootPath = config.rootPath;
        await utooPackBundler.build(utooPackOpts, projectPath, rootPath);
      } else {
        await webpackBundler.build(webpackBundlerOpts as any);
      }
    }
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

export default bundle;
