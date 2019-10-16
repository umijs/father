import * as assert from 'assert';
import chalk from 'chalk';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import ghPages from 'gh-pages';
import * as docz from './docz';
import * as storybook from './storybook';

const DOC_PATH = '.doc';

export interface DocProps {
  cwd: string;
  cmd: string;
  params: string[];
  args: any;
  userConfig: any;
  DOC_PATH?: typeof DOC_PATH;
}

export function devOrBuild(option: DocProps) {
  const mergedOption: DocProps = {
    ...option,
    DOC_PATH,
  };

  if ((option.args || {}).storybook) {
    return storybook.devOrBuild(mergedOption);
  }
  return docz.devOrBuild(mergedOption);
}

export function deploy({ cwd, args }) {
  return new Promise((resolve, reject) => {
    const distDir = join(cwd, DOC_PATH);

    assert.ok(existsSync(distDir), `Please run ${chalk.green(`father doc build`)} first`);

    copyFileSync(join(distDir, 'index.html'), join(distDir, '404.html'));

    ghPages.publish(distDir, args, err => {
      if (err) {
        reject(new Error(`Doc deploy failed. ${err.message}`));
      } else {
        resolve();
      }
    });
  });
}
