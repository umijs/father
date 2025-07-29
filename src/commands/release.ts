import { IApi } from '../types';
import { logger } from '../utils';

export default (api: IApi) => {
  api.registerCommand({
    name: 'release',
    description: 'release (unavailable)',
    fn({ args }) {
      args;
      logger.info(`release`);
    },
  });
};
