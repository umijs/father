import type { ExtendedLoaderContext, RunLoaderResult } from 'loader-runner';
import type { IBundlessConfig } from './config';

/**
 * normal loader type (base on webpack loader)
 */
export type ILoader = (
  this: ExtendedLoaderContext & { config: IBundlessConfig },
  content: RunLoaderResult['resourceBuffer'],
) => typeof content;

/**
 * bundless transformer type
 */
export interface ITransformer {
  new (config: IBundlessConfig): ITransformer;

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
