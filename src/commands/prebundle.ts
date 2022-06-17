import { logger } from '@umijs/utils';
import { IApi } from '../types';

export default (api: IApi) => {
  // to avoid conflict with schema
  api.describe({ key: 'prebundle-command' });

  api.registerCommand({
    name: 'prebundle',
    description: 'prebundle',
    fn({ args }) {
      args;
      logger.info(`prebundle`);
    },
  });
};
