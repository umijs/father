import esbuild from '@umijs/bundler-utils/compiled/esbuild';
import { register, resolve } from '@umijs/utils';
import { IApi } from '../types';
export const requireResolve = (path: string) => {
  return resolve.sync(path, {
    basedir: __dirname,
    extensions: ['.ts', '.js'],
  });
};

export default (api: IApi) => {
  // to avoid conflict with schema
  api.describe({ key: 'prebundle-command' });

  api.registerCommand({
    name: 'prebundle',
    description: 'pre-bundle third-party dependencies for project',
    async fn() {
      // require as async to avoid ncc hack fs methods
      // then cause service restart error in dev command
      // use require() rather than import(), to avoid jest runner to fail
      // ref: https://github.com/nodejs/node/issues/35889
      register.register({
        implementor: esbuild,
        exts: ['.ts', '.mjs'],
      });
      register.clearFiles();
      const {
        default: preBundle,
      }: typeof import('../prebundler') = require('../prebundler');
      register.restore();
      if (api.config.prebundle) {
        await preBundle({
          userConfig: api.config.prebundle,
          cwd: api.cwd,
          pkg: api.pkg,
        });
      }
    },
  });
};
