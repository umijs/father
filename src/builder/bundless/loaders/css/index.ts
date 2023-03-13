import type {
  IBundlessLoader,
  ICSSPreprocessor,
  ILoaderOutput,
} from '../types';

const preprocessors: Record<string, ICSSPreprocessor> = {};

export interface IPreprocessorItem {
  id: string;
  preprocessor: string;
}

/**
 * add css preprocessor
 * @param item
 */
export function addPreprocessor(item: IPreprocessorItem) {
  const mod = require(item.preprocessor);
  const preprocessor: ICSSPreprocessor = mod.default || mod;

  preprocessors[item.id] = preprocessor;
}

function getCSSPreprocessor(resource: string) {
  if (/\.less$/.test(resource)) {
    return preprocessors['less'];
  }

  if (/\.s(a|c)ss$/.test(resource)) {
    return preprocessors['sass'];
  }

  // using less by default
  return preprocessors['less'];
}

/**
 * builtin css loader
 */
const cssLoader: IBundlessLoader = function (content) {
  const preprocessor = getCSSPreprocessor(this.resource);
  const outputOpts: ILoaderOutput['options'] = {
    ext: '.css',
  };

  const ret = preprocessor.call(
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

  // handle async preprocessor
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

export default cssLoader;
