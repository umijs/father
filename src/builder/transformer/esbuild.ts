import { IFatherTransformerTypes } from '../../types';
import type { ITransformerConfig } from '../executor/bundless';

/**
 * esbuild transformer
 */
class ESBuildTransformer {
  static id = IFatherTransformerTypes.ESBUILD;

  constructor(config: ITransformerConfig) {
    config;
    // TODO: create esbuild instance from config
  }

  process(content: string) {
    // TODO: transform content
    return content;
  }
}

export default ESBuildTransformer;
