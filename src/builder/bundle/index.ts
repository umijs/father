import { logger, rimraf } from '@umijs/utils';
import path from 'path';
import type { BundleConfigProvider } from '../config';

export default async (opts: {
  cwd: string;
  configProvider: BundleConfigProvider;
}) => {
  opts.configProvider.configs.forEach((config) => {
    // clean dist dir
    rimraf.sync(config.output!);

    logger.info(
      `[bundle] from ${path.relative(
        opts.cwd,
        config.entry,
      )} to ${path.relative(opts.cwd, config.output!)}`,
    );
  });
};
