import type {
  ILoaderContext,
  IBundlessLoader,
  ILoaderOutput,
  IBundlessConfig,
} from 'father';
import type { InlineConfig as ViteInlineConfig } from 'vite';

type SourceMap = string | null | undefined;

type IVueTransformerResult = [ILoaderOutput['content'], SourceMap?];

export type IVueLoaderContext = ILoaderContext & {
  paths: {
    cwd: string;
    fileAbsPath: string;
    itemDistAbsPath: string;
  };
};

/**
 * bundless transformer type
 */
export type IVueTransformer = (
  this: IVueLoaderContext,
  content: Parameters<IBundlessLoader>[0],
) => IVueTransformerResult | Promise<IVueTransformerResult>;

/**
 * type of config processor
 */
export type IConfigProcessor = (
  userConfig: Partial<IBundlessConfig>,
  currentViteConfig: Partial<ViteInlineConfig>,
) => Partial<ViteInlineConfig>;
