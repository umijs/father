import {
  getNpmClient,
  installWithNpmClient,
  logger,
  prompts,
} from '@umijs/utils';
import { writeFileSync } from 'fs';
import { IApi } from '../../types';

export class GeneratorHelper {
  constructor(readonly api: IApi) {}

  addDevDeps(deps: Record<string, string>) {
    const { api } = this;
    api.pkg.devDependencies = {
      ...api.pkg.devDependencies,
      ...deps,
    };
    writeFileSync(api.pkgPath, JSON.stringify(api.pkg, null, 2));
    logger.info('Write package.json');
  }

  addScript(name: string, cmd: string) {
    const { api } = this;
    this.addScriptToPkg(name, cmd);
    writeFileSync(api.pkgPath, JSON.stringify(api.pkg, null, 2));
    logger.info('Update package.json for scripts');
  }

  private addScriptToPkg(name: string, cmd: string) {
    const { api } = this;
    const pkgScriptsName = api.pkg.scripts?.[name];
    if (pkgScriptsName && pkgScriptsName !== cmd) {
      logger.warn(
        `scripts.${name} = "${pkgScriptsName}" already exists, will be overwritten with "${cmd}"!`,
      );
    }

    api.pkg.scripts = {
      ...api.pkg.scripts,
      [name]: cmd,
    };
  }

  installDeps() {
    const { api } = this;
    const npmClient = getNpmClient({ cwd: api.cwd });
    installWithNpmClient({
      npmClient,
    });
    logger.info(`Install dependencies with ${npmClient}`);
  }
}

export function promptsExitWhenCancel<T extends string = string>(
  questions: prompts.PromptObject<T> | Array<prompts.PromptObject<T>>,
  options?: Pick<prompts.Options, 'onSubmit'>,
): Promise<prompts.Answers<T>> {
  return prompts(questions, {
    ...options,
    onCancel: () => {
      process.exit(1);
    },
  });
}
