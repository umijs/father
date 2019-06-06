import { DocProps } from '.';
import storybook from '@storybook/react/standalone';
import generator from './storybook-generator';

export function devOrBuild({ cwd, cmd }: DocProps) {
  const { storybookPath } = generator(cwd);

  if (cmd === 'build') {
    storybook({
      mode: 'static',
      // 相对路径，storybook 会自动拼接 cmd 所在的位置
      outputDir: './build',
      configDir: storybookPath,
    });
  } else {
    // Dev mode
    storybook({
      mode: 'dev',
      port: '9001',
      configDir: storybookPath,
    });
  }
}
