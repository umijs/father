import type { ITransformerConfig } from '../executor/bundless';

/**
 * babel transformer
 */
class BabelTransformer {
  static id = 'babel';

  constructor(config: ITransformerConfig) {
    config;
    // TODO: create babel instance from config
  }

  process(content: string) {
    // TODO: transform content
    return content;
  }
}

export default BabelTransformer;
