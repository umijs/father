import type { IBundlessLoader, IJSTransformer } from '../types';

const transformers: Record<string, IJSTransformer> = {};

export interface ITransformerItem {
  id: string;
  transformer: string;
}

/**
 * add javascript transformer
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
  this.setOutputOptions({ ext: '.js', declaration: true });

  const ret = transformer.call(
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

  // handle async transformer
  if (ret instanceof Promise) {
    const cb = this.async();

    ret.then(
      (r) => cb(null, r),
      (e) => cb(e),
    );
  } else {
    return ret;
  }
};

export default jsLoader;
