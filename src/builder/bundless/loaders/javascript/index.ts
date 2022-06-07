import type { IBundlessLoader, IJSTransformer } from '../types';

const transformers: Record<string, IJSTransformer> = {};

export interface ITransformerItem {
  id: string;
  transformer: string;
}

/**
 * add javascript tranformer
 * @param item
 */
export function addTransformer(item: ITransformerItem) {
  const mod = require(item.transformer);
  const transformer: IJSTransformer = mod.default || mod;

  transformers[item.id] = transformer;
}

/**
 * builtin javascript loader
 */
const jsLoader: IBundlessLoader = function (content) {
  const transformer = transformers[this.config.transformer!];

  // TODO: .mjs, .cjs support
  this.setOutputExt('.js');

  return transformer.call(
    {
      config: this.config,
      pkg: this.pkg,
      paths: {
        cwd: this.resourcePath!,
        fileAbsPath: this.resource,
      },
    },
    content!.toString(),
  );
};

export default jsLoader;
