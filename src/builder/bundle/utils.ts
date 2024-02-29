import { chalk, lodash } from '@umijs/utils';
import path from 'path';
import { logger } from '../../utils';
import type { IBundleConfig } from '../config';

// workaround for combine continuous onBuildComplete log in watch mode
export const logStatus = (config: IBundleConfig) => {
  lodash.debounce(
    () =>
      logger.info(
        `Bundle from ${chalk.yellow(config.entry)} to ${chalk.yellow(
          path.join(config.output.path, config.output.filename),
        )}`,
      ),
    100,
    { leading: true, trailing: false },
  );
};
