import { GeneratorType } from '@umijs/core';
import { getNpmClient, glob, logger } from '@umijs/utils';
import { exec } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { IApi } from '../../types';
import { GeneratorHelper } from './utils';

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
      return (
        glob.sync('.commitlintrc?(.*)').length === 0 &&
        glob.sync('commitlint.config.*').length === 0
      );
    },
    disabledDescription:
      'Commitlint has already enabled. You can remove commitlint config, then run this again to re-setup.',
    fn: async () => {
      const h = new GeneratorHelper(api);

      const inGit = existsSync(join(api.paths.cwd, '.git'));
      const deps = {
        '@commitlint/cli': '^17.1.2',
        '@commitlint/config-conventional': '^17.1.0',
      } as any;

      if (inGit) {
        // Git hooks
        deps['husky'] = '^8.0.1';
        h.addScript('postinstall', 'husky install');
      }

      h.addDevDeps(deps);

      writeFileSync(
        join(api.cwd, 'commitlint.config.ts'),
        `
export default {
  extends: ['@commitlint/config-conventional'],
};
`.trimStart(),
      );

      logger.info('Write commitlint.config.ts');

      h.installDeps();

      if (inGit) {
        const npmClient = getNpmClient({ cwd: api.cwd });
        exec(
          `${npmClient} husky add .husky/commit-msg '${npmClient} commitlint --edit $1'`,
        );
      }
    },
  });
};
