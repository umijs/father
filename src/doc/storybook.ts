import { DocProps } from '.';
import storybook from '@storybook/react/standalone';
import generator from './storybook-generator';


export function devOrBuild({ cwd, cmd }: DocProps) {
  const { storybookPath } = generator(cwd);
  console.log('=>', storybookPath);

  storybook({
    mode: 'dev',
    port: '9001',
    configDir: storybookPath,
  });
}
