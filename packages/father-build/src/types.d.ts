import { RollupOptions } from 'rollup';
import { IGetRollupConfigOpts } from './getRollupConfig';

export type BundleType = 'rollup' | 'babel';

interface IBundleTypeOutput {
  type: BundleType;
  file?: string;
}

export interface ICjs extends IBundleTypeOutput {
  minify?: boolean;
  lazy?: boolean;
}

interface IEsm extends IBundleTypeOutput {
  mjs?: boolean;
  minify?: boolean;
  importLibToEs?: boolean;
}

interface IStringObject {
  [prop: string]: string;
}

interface IUmd {
  globals?: IStringObject;
  name?: string;
  minFile?: boolean;
  file?: string;
  sourcemap?: boolean;
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
  extraRollupPlugins?: any[];
  extraExternals?: string[];
  externalsExclude?: string[];
  cssModules?: boolean | Object;
  extractCSS?: boolean;
  injectCSS?: boolean | ((varname: string, filename: string) => string);
  inject?: Object;
  autoprefixer?: Object;
  include?: string | RegExp;
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
  lessInBabelMode?:
    | boolean
    | {
        paths?: any[];
        plugins?: any[];
      };
  typescriptOpts?: {
    [value: string]: any;
  };
  nodeResolveOpts?: {
    [value: string]: any;
  };
  lessInRollupMode?: {
    [opt: string]: any;
  };
  sassInRollupMode?: {
    [opt: string]: any;
  };
  pkgs?: string[];
  /** 处理 lerna 包 */
  pkgFilter?: {
    /** 指定包含的包 */
    include?: string[];
    /** 指定排除的包 */
    exclude?: string[];
    /**
     * 跳过私有的包 package.json private
     * @default false
     * */
    skipPrivate?: boolean;
  };
  config?: string;
  /**
   * 提供对 rollup 设置项进行自定义修改的能力
   * @param rollupOptions rollup 配置项
   * @param opts 编译环境配置项
   * @returns 修改后的 rollup 配置项
   */
  hookRollupConfig?: (rollupOptions: RollupOptions[], environment: IGetRollupConfigOpts) => RollupOptions[];
}

export interface IOpts {
  cwd: string;
  watch?: boolean;
  buildArgs?: IBundleOptions;
  rootConfig?: IBundleOptions;
  rootPath?: string;
}

export type Dispose = () => void;
