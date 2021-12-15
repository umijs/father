import { IFatherJSTransformerTypes } from '../../../../types';
import type { IBundlessConfig } from '../..';

/**
 * babel transformer
 */
class BabelTransformer {
  static id = IFatherJSTransformerTypes.BABEL;

  constructor(config: IBundlessConfig) {
    config;
    // TODO: create babel instance from config
  }

  process(content: string) {
    // TODO: transform content
    return content;
  }
}

export default BabelTransformer;
