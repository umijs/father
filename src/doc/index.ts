import * as docz from './docz';
import * as storybook from './storybook';

export interface DocProps {
  cwd: string;
  cmd: string;
  params: string[];
  args: any;
  userConfig: any;
}

export interface DeployProps {
  cwd: string;
  args: any;
}

export function devOrBuild(option: DocProps) {
  if ((option || {})['--storybook']) {
    return storybook.devOrBuild(option);
  }
  return docz.devOrBuild(option);
}

export function deploy(option: DeployProps) {
  if ((option || {})['--storybook']) {
    return storybook.deploy(option);
  }
  return docz.deploy(option);
}
