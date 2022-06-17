import { logger } from '@umijs/utils';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'prebundle',
    description: 'prebundle',
    fn({ args }) {
      args;
      logger.info(`prebundle`);
    },
  });
};
