import { chalk, importLazy } from '@umijs/utils';
import path from 'path';
import { CACHE_PATH } from '../../constants';
import type { BundleConfigProvider } from '../config';
import { getBabelPresetReactOpts, getBundleTargets } from '../utils';
import { logger } from '../../utils';

const bundler: typeof import('@umijs/bundler-webpack') = importLazy(
  path.dirname(require.resolve('@umijs/bundler-webpack/package.json')),
);
const {
  CSSMinifier,
  JSMinifier,
}: typeof import('@umijs/bundler-webpack/dist/types') = importLazy(
  require.resolve('@umijs/bundler-webpack/dist/types'),
);

export default async (opts: {
  cwd: string;
  configProvider: BundleConfigProvider;
  buildDependencies?: string[];
}) => {
  const enableCache = process.env.FATHER_CACHE !== 'none';

  for (const config of opts.configProvider.configs) {
    logger.info(
      `Bundle from ${chalk.yellow(config.entry)} to ${chalk.yellow(
        path.join(config.output.path, config.output.filename),
      )}`,
    );

    const { plugins: extraPostCSSPlugins, ...postcssLoader } =
      config.postcssOptions || {};

    await bundler.build({
      cwd: opts.cwd,
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
        },
      ],
      beforeBabelPlugins: [require.resolve('babel-plugin-dynamic-import-node')],
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
    });
  }
};
