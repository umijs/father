import type { ILoaderContext, IBundlessLoader, ILoaderOutput } from 'father';

type SourceMap = string | null | undefined;

type IVueTransformerResult = [ILoaderOutput['content'], SourceMap?];

/**
 * bundless transformer type
 */
export type IVueTransformer = (
  this: ILoaderContext & {
    paths: {
      cwd: string;
      fileAbsPath: string;
      itemDistAbsPath: string;
    };
  },
  content: Parameters<IBundlessLoader>[0],
) => IVueTransformerResult | Promise<IVueTransformerResult>;
