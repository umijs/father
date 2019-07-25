export type BundleType = 'rollup' | 'babel';

interface IBundleTypeOutput {
  type: BundleType;
  file?: string;
}

interface ICjs extends IBundleTypeOutput {
  minify?: boolean;
}

interface IEsm extends IBundleTypeOutput {
  mjs?: boolean;
  minify?: boolean;
  importLibToEs?: boolean;
}

interface IStringObject {
  [prop: string]: string;
}

interface IStringArrayObject {
  [prop: string]: string[];
}

interface IUmd {
  globals?: IStringObject;
  name?: string;
  minFile?: boolean;
  file?: string;
}

export interface IBundleOptions {
  entry?: string | string[];
  file?: string;
  esm?: BundleType | IEsm | false;
  cjs?: BundleType | ICjs | false;
  umd?: IUmd | false;
  extraBabelPlugins?: any[];
  extraBabelPresets?: any[];
  extraPostCSSPlugins?: any[];
  extraExternals?: string[];
  cssModules?: boolean | Object;
  extractCSS?: boolean;
  autoprefixer?: Object;
  namedExports?: IStringArrayObject;
  runtimeHelpers?: boolean;
  target?: 'node' | 'browser';
  overridesByEntry?: {
    [entry: string]: any;
  };
  replace?: {
    [value: string]: any;
  };
  browserFiles?: {
    [value: string]: any;
  };
  nodeFiles?: {
    [value: string]: any;
  };
  nodeVersion?: number;
  disableTypeCheck?: boolean;
  preCommit?: {
    eslint?: boolean;
    prettier?: boolean;
  };
  lessInBabelMode?: {
    paths?: any[];
    plugins?: any[];
  };
  typescriptOpts?: {
    [value: string]: any;
  };
  nodeResolveOpts?: {
    [value: string]: any;
  };
}

export interface IOpts {
  cwd: string;
  watch?: boolean;
  buildArgs?: IBundleOptions;
  rootPath?: string;
}
