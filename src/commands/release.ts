import { logger } from '../utils';
import { IApi } from '../types';

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
