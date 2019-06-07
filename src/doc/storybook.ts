import { DocProps } from '.';
import storybook from '@storybook/react/standalone';
import generator from './storybook-generator';

export function devOrBuild({ cwd, cmd, DOC_PATH }: Partial<DocProps>) {
  const { storybookPath } = generator(cwd);

  if (cmd === 'build') {
    return storybook({
      mode: 'static',
      outputDir: DOC_PATH,
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
