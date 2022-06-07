import type { ExtendedLoaderContext, RunLoaderResult } from 'loader-runner';
import { IApi } from '../types';
import type { IBundlessConfig } from './config';

/**
 * normal loader type (base on webpack loader)
 */
export type ILoader = (
  this: ExtendedLoaderContext & {
    config: IBundlessConfig;
    fileAbsPath: string;
    pkg: IApi['pkg'];
  },
  content: RunLoaderResult['resourceBuffer'],
) => typeof content;

/**
 * bundless transformer type
 */
export interface ITransformer {
  new (opts: {
    config: IBundlessConfig;
    cwd: string;
    fileAbsPath: string;
    pkg: IApi['pkg'];
  }): ITransformer;

  /**
   * transformer identifier
   * @note  such as babel or esbuild
   */
  id: string;

  /**
   * transform raw to result
   */
  process: (
    content: RunLoaderResult['resourceBuffer'],
  ) => RunLoaderResult['resourceBuffer'];
}
