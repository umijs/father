import type { ExtendedLoaderContext } from 'loader-runner';
import type { IApi } from '../../../types';
import type { IBundlessConfig } from '../../config';

export interface ILoaderOuput {
  result: string;
  options: {
    ext?: string;
    declaration?: boolean;
  };
}

export interface ILoaderContext {
  /**
   * final bundless config
   */
  config: IBundlessConfig;
  /**
   * project package.json
   */
  pkg: IApi['pkg'];
}

/**
 * normal loader type (base on webpack loader)
 */
export type IBundlessLoader = (
  this: ExtendedLoaderContext &
    ILoaderContext & {
      setOuputOptions: (options: ILoaderOuput['options']) => void;
    },
  content: string,
) => string;

/**
 * bundless transformer type
 */
export type IJSTransformer = (
  this: ILoaderContext & {
    paths: {
      cwd: string;
      fileAbsPath: string;
    };
  },
  content: Parameters<IBundlessLoader>[0],
) => ReturnType<IBundlessLoader>;
