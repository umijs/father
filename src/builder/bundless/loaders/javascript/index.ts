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
  const transformer = new transformers[this.config.transformer!]({
    config: this.config,
    cwd: this.resourcePath!,
    pkg: this.pkg,
    fileAbsPath: this.resource,
  });

  // TODO: .mjs, .cjs support
  this.setOutputExt('.js');

  return transformer.process(content);
};

export default jsLoader;
