import { IApi } from '../types';

export default (api: IApi) => {
  // to avoid conflict with schema
  api.describe({ key: 'prebundle-command' });

  api.registerCommand({
    name: 'prebundle',
    description: 'prebundle',
    async fn() {
      // require as async to avoid ncc hack fs methods
      // then cause service restart error in dev command
      // use require() rather than import(), to avoid jest runner to fail
      // ref: https://github.com/nodejs/node/issues/35889
      const {
        default: preBundle,
      }: typeof import('../prebundler') = require('../prebundler');

      await preBundle({
        userConfig: api.userConfig.prebundle,
        cwd: api.cwd,
        pkg: api.pkg,
      });
    },
  });
};
