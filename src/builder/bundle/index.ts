import { chalk, importLazy, logger } from '@umijs/utils';
import path from 'path';
import type { BundleConfigProvider } from '../config';

const bundler: typeof import('@umijs/bundler-webpack') = importLazy(
  path.dirname(require.resolve('@umijs/bundler-webpack/package.json')),
);

export default async (opts: {
  cwd: string;
  configProvider: BundleConfigProvider;
}) => {
  for (const config of opts.configProvider.configs) {
    logger.info(
      `Bundle from ${chalk.yellow(
        path.relative(opts.cwd, config.entry),
      )} to ${chalk.yellow(path.relative(opts.cwd, config.output!))}`,
    );

    const parsedOutput = path.parse(config.output!);
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
        outputPath: path.relative(opts.cwd, parsedOutput.dir),

        // postcss config
        extraPostCSSPlugins,
        postcssLoader,
      },
      entry: {
        [parsedOutput.name]: config.entry,
      },
      extraBabelPresets: config.extraBabelPresets,
      extraBabelPlugins: config.extraBabelPlugins,

      // configure library related options
      chainWebpack(memo: any) {
        memo.output.libraryTarget('umd');

        // modify webpack target
        if (config.platform === 'node') {
          memo.target('node');
        }

        return memo;
      },
    });
  }
};
