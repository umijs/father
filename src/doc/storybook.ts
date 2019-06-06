import ghPages from 'gh-pages';
import { join } from 'path';
import { DocProps } from '.';
import storybook from '@storybook/react/standalone';
import generator from './storybook-generator';

export function devOrBuild({ cwd, cmd }: Partial<DocProps>) {
  const { storybookPath } = generator(cwd);

  if (cmd === 'build') {
    return storybook({
      mode: 'static',
      // 相对路径，storybook 会自动拼接 cmd 所在的位置
      outputDir: './build',
      configDir: storybookPath,
    });
  } else {
    // Dev mode
    return storybook({
      mode: 'dev',
      port: '9001',
      configDir: storybookPath,
    });
  }
}

export async function deploy({ cwd, args }) {
  const distDir = join(cwd, 'build');
  await devOrBuild({ cwd, cmd: 'build' });

  return new Promise((resolve, reject) => {
    ghPages.publish(distDir, args, err => {
      if (err) {
        reject(new Error(`Doc deploy failed. ${err.message}`));
      } else {
        resolve();
      }
    });
  });
}
