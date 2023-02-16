import { logger } from '../utils';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'changelog',
    description: 'changelog (unavailable)',
    fn({ args }) {
      args;
      logger.info(`changelog`);
    },
  });
};
