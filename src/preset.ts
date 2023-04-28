import { resolve } from '@umijs/utils';
import { IApi } from './types';

const requireResolve = (path: string) => {
  return resolve.sync(path, {
    basedir: __dirname,
    extensions: ['.ts', '.js'],
  });
};

export default (api: IApi) => {
  api.onStart(() => {});
  return {
    plugins: [
      requireResolve('./registerMethods'),

      // commands
      requireResolve('./commands/dev'),
      requireResolve('./commands/doctor'),
      requireResolve('./commands/build'),
      requireResolve('./commands/changelog'),
      requireResolve('./commands/prebundle'),
      requireResolve('./commands/release'),
      requireResolve('./commands/version'),
      requireResolve('./commands/help'),
      requireResolve('./commands/generators/jest'),
      requireResolve('./commands/generators/commitlint'),
      requireResolve('./commands/generators/eslint'),
      requireResolve('./commands/generators/stylelint'),
      requireResolve('./commands/generators/lint'),

      // features
      requireResolve('./features/configBuilder/configBuilder'),
      requireResolve('./features/configPlugins/configPlugins'),
      requireResolve('./features/depsOnDemand/swc'),
    ],
  };
};
