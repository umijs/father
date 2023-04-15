import type { IBundlessLoader, ILoaderOutput } from 'father';
import { transformer } from './transformer';

/**
 * builtin vue loader
 */
const vueLoader: IBundlessLoader = function (content) {
  const outputOpts: ILoaderOutput['options'] = {};

  if (/\.vue$/.test(this.resource)) {
    outputOpts.ext = '.vue.js';
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

export default vueLoader;
