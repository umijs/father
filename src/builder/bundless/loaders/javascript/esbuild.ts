import { IFatherJSTransformerTypes } from '../../../../types';
import type { IBundlessConfig } from '../..';

/**
 * esbuild transformer
 */
class ESBuildTransformer {
  static id = IFatherJSTransformerTypes.ESBUILD;

  constructor(config: IBundlessConfig) {
    config;
    // TODO: create esbuild instance from config
  }

  process(content: string) {
    // TODO: transform content
    return content;
  }
}

export default ESBuildTransformer;
