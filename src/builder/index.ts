import path from 'path';
import { logger, rimraf } from '@umijs/utils';
import { normalizeUserConfig } from './config';
import bundle from './bundle';
import bundless from './bundless';
import { IFatherBuildTypes, IFatherConfig } from '../types';

export default async (opts: { userConfig: IFatherConfig; cwd: string }) => {
  const configs = normalizeUserConfig(opts.userConfig, { cwd: opts.cwd });

  for (let config of configs) {
    // clean dist dir
    rimraf.sync(config.output!);

    switch (config.type) {
      case IFatherBuildTypes.BUNDLE:
        logger.info(
          `[bundle] from ${path.relative(
            opts.cwd,
            config.entry,
          )} to ${path.relative(opts.cwd, config.output!)}`,
        );
        await bundle(config);
        break;

      case IFatherBuildTypes.BUNDLESS:
        logger.info(
          `[bundless] from ${path.relative(
            opts.cwd,
            config.input,
          )} to ${path.relative(opts.cwd, config.output!)}`,
        );
        await bundless(config);
        break;

      default:
    }
  }
};
