import { chalk, importLazy, logger } from '@umijs/utils';
import path from 'path';
import { CACHE_PATH } from '../../constants';
import type { BundleConfigProvider } from '../config';
import { getBabelPresetReactOpts } from '../utils';

const bundler: typeof import('@umijs/bundler-webpack') = importLazy(
  path.dirname(require.resolve('@umijs/bundler-webpack/package.json')),
);

export default async (opts: {
  cwd: string;
  configProvider: BundleConfigProvider;
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
        externals: config.externals,
        outputPath: config.output.path,

        // postcss config
        extraPostCSSPlugins,
        postcssLoader,

        // compatible with IE11 by default
        userConfig: {
          targets: { ie: 11 },
          jsMinifier: 'terser',
          cssMinifier: 'cssnano',
        },
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
          presetEnv: {},
          presetReact: getBabelPresetReactOpts(opts.configProvider.pkg),
          presetTypeScript: {},
          pluginTransformRuntime: {},
          pluginLockCoreJS: {},
          pluginDynamicImportNode: false,
        },
      ],
      extraBabelPresets: config.extraBabelPresets,
      extraBabelPlugins: config.extraBabelPlugins,

      // configure library related options
      chainWebpack(memo: any) {
        memo.output.libraryTarget('umd');

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
              cacheDirectory: path.join(opts.cwd, CACHE_PATH, 'bundle-webpack'),
            },
          }
        : {}),
    });
  }
};
