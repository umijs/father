import * as docz from './docz';

interface DevProps {
  cwd: string;
  cmd: string;
  params: any;
  userConfig: any;
}

interface DeployProps {
  cwd: string;
  args: any;
}

export function devOrBuild(option: DevProps) {
  return docz.devOrBuild(option);
}

export function deploy(option: DeployProps) {
  return docz.deploy(option);
}
