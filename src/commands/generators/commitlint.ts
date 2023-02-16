import { GeneratorType } from '@umijs/core';
import { getNpmClient } from '@umijs/utils';
import { execSync } from 'child_process';
import fg from 'fast-glob';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '../../types';
import { GeneratorHelper } from './utils';
import { logger } from '../../utils';

export default (api: IApi) => {
  api.describe({
    key: 'generator:commitlint',
  });

  api.registerGenerator({
    key: 'commitlint',
    name: 'Enable Commitlint',
    description: 'Setup Commitlint Configuration',
    type: GeneratorType.enable,
    checkEnable: () => {
      const pkg = JSON.parse(
        readFileSync(join(api.paths.cwd, 'package.json'), 'utf-8'),
      );
      return (
        ['.commitlintrc?(.*)', 'commitlint.config.*'].every(
          (pattern) =>
            fg.sync(pattern, {
              cwd: api.paths.cwd,
            }).length === 0,
        ) && !pkg['commitlint']
      );
    },
    disabledDescription:
      'Commitlint has already enabled. You can remove commitlint config, then run this again to re-setup.',
    fn: async () => {
      const inGit = existsSync(join(api.paths.cwd, '.git'));
      if (!inGit) {
        logger.warn('Only available for git project, exit');
        return;
      }

      const h = new GeneratorHelper(api);

      const deps = {
        '@commitlint/cli': '^17.1.2',
        '@commitlint/config-conventional': '^17.1.0',
        husky: '^8.0.1',
      };

      h.addDevDeps(deps);
      h.addScript('prepare', 'husky install');

      api.pkg['commitlint'] = {
        extends: ['@commitlint/config-conventional'],
      };
      writeFileSync(api.pkgPath, JSON.stringify(api.pkg, null, 2));
      logger.quietExpect.info('Update package.json for commitlint');

      h.installDeps();
      const npmClient = getNpmClient({ cwd: api.cwd });
      execSync(
        `${npmClient} husky add .husky/commit-msg '${npmClient} commitlint --edit $1'`,
      );
      logger.quietExpect.info('Create a hook for commitlint');
    },
  });
};
