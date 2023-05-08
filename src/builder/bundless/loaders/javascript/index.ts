import esbuild from '@umijs/bundler-utils/compiled/esbuild';
import { register } from '@umijs/utils';
import { getTsconfig } from '../../dts';
import type { IBundlessLoader, IJSTransformer, ILoaderOutput } from '../types';
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
  register.register({
    implementor: esbuild,
    exts: ['.ts', '.mjs'],
  });
  register.clearFiles();
  const mod = require(item.transformer);
  register.restore();

  const transformer: IJSTransformer = mod.default || mod;

  transformers[item.id] = transformer;
}

/**
 * builtin javascript loader
 */
const jsLoader: IBundlessLoader = function (content) {
  const transformer = transformers[this.config.transformer!];
  const outputOpts: ILoaderOutput['options'] = {};

  // specify output ext for non-js file
  if (/\.(jsx|tsx?)$/.test(this.resource)) {
    outputOpts.ext = '.js';
  }

  // mark for output declaration file
  if (
    /\.tsx?$/.test(this.resource) &&
    getTsconfig(this.context!)?.options.declaration
  ) {
    outputOpts.declaration = true;
  }

  const ret = transformer.call(
    {
      config: this.config,
      pkg: this.pkg,
      paths: {
        cwd: this.cwd,
        fileAbsPath: this.resource,
        itemDistAbsPath: this.itemDistAbsPath,
      },
    },
    content!.toString(),
  );

  // handle async transformer
  if (ret instanceof Promise) {
    const cb = this.async();

    ret.then(
      (r) => {
        outputOpts.map = r[1];
        this.setOutputOptions(outputOpts);
        cb(null, r[0]);
      },
      (e) => cb(e),
    );
  } else {
    outputOpts.map = ret[1];
    this.setOutputOptions(outputOpts);
    return ret[0];
  }
};

export default jsLoader;
