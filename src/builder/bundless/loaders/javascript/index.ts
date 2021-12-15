import { ILoader, ITransformer } from '../../../protocol';

const transformers: Record<string, ITransformer> = {};

/**
 * add javascript tranformer
 * @param transformer
 */
export function addTransformer(transformer: ITransformer) {
  transformers[transformer.id] = transformer;
}

/**
 * builtin javascript loader
 */
const jsLoader: ILoader = function (content) {
  const transformer = new transformers[this.config.transformer!](this.config);

  return transformer.process(content);
};

export default jsLoader;
