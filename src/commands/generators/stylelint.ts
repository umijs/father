import { GeneratorType } from '@umijs/core';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '../../types';
import { GeneratorHelper } from './utils';
import { logger } from '../../utils';

export default (api: IApi) => {
  api.describe({
    key: 'generator:stylelint',
  });

  api.registerGenerator({
    key: 'stylelint',
    name: 'Enable Stylelint',
    description: 'Setup Stylelint Configuration',
    type: GeneratorType.enable,
    checkEnable: () => {
      return (
        !existsSync(join(api.paths.cwd, '.stylelintrc')) &&
        !existsSync(join(api.paths.cwd, 'stylelint.config.js'))
      );
    },
    disabledDescription:
      'Stylelint has already enabled. You can remove .stylelintrc/stylelint.config.js, then run this again to re-setup.',
    fn: async () => {
      const h = new GeneratorHelper(api);

      const deps = {
        '@umijs/lint': '^4',
        stylelint: '^14.11.0',
      };

      h.addDevDeps(deps);
      h.addScript('lint:css', 'stylelint "{src,test}/**/*.{css,less}"');

      writeFileSync(
        join(api.cwd, '.stylelintrc'),
        `
{
  "extends": "@umijs/lint/dist/config/stylelint"
}
`.trimStart(),
      );

      logger.quietExpect.info('Write .stylelintrc');

      h.installDeps();
    },
  });
};
