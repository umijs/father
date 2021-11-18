import builder from '../builder';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build',
    async fn({ args }) {
      const finalArgs = {
        // disable umd in dev by default
        umd: args.umd ?? (!args.esm && api.service.env === 'production'),
        esm: args.esm ?? !args.umd,
      };

      // support to build specific dist type via cli args
      const pickedConfig = {
        ...api.config,
        ...(finalArgs.umd ? { umd: api.config.umd } : { umd: undefined }),
        ...(finalArgs.esm ? { esm: api.config.esm } : { esm: undefined }),
      };

      await builder({
        userConfig: pickedConfig,
        cwd: api.cwd,
      });
    },
  });
};
