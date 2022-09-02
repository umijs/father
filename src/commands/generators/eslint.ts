import { GeneratorType } from '@umijs/core';
import { glob, logger } from '@umijs/utils';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '../../types';
import { GeneratorHelper } from './utils';

export default (api: IApi) => {
  api.describe({
    key: 'generator:eslint',
  });

  api.registerGenerator({
    key: 'eslint',
    name: 'Enable Eslint',
    description: 'Setup Eslint Configuration',
    type: GeneratorType.enable,
    checkEnable: () => {
      return glob.sync('.eslintrc?(.js)').length === 0;
    },
    disabledDescription:
      'Eslint has already enabled. You can remove .eslintrc, then run this again to re-setup.',
    fn: async () => {
      const h = new GeneratorHelper(api);

      const deps = {
        '@umijs/lint': '^4',
        eslint: '^8.23.0',
      };

      h.addDevDeps(deps);
      h.addScript('lint:es', 'eslint "{src,test}/**/*.{js,jsx,ts,tsx}"');

      writeFileSync(
        join(api.cwd, '.eslintrc.js'),
        `
module.exports = {
  extends: require.resolve('@umijs/lint/dist/config/eslint'),
};
`.trimStart(),
      );

      logger.info('Write .eslintrc.js');

      h.installDeps();
    },
  });
};
