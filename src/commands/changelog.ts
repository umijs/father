import { IApi } from '../types';
import { logger } from '../utils';

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
