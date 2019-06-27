import { Config as IDoczConfig } from 'docz-core';
import { IBundleOptions as IBundleOptionsFromBuild, IOpts } from 'father-build/src/types';

export { IOpts };
export function build(opts: IOpts): Promise<any>;

export interface IDocOpts {
  cwd: string;
  cmd: string;
  params?: any;
  userConfig?: any;
}

interface IDoc {
  devOrBuild(opts: IDocOpts): Promise<any>;
}

export const doc: IDoc;

export interface IBundleOptions extends IBundleOptionsFromBuild {
  doc?: IDoczConfig;
}
