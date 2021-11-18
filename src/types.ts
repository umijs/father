import type { IServicePluginAPI, PluginAPI } from '@umijs/core';
import type { ITransformer } from './builder/protocol';

export type IApi = PluginAPI &
  IServicePluginAPI & {
    /**
     * register bundless transformer
     */
    registerBundlessTransformer: (transformer: ITransformer) => void;
  };

export interface IFatherBaseConfig {
  /**
   * compile targets
   * @note  such as { chrome: 49 }
   */
  targets?: Record<string, number>;

  /**
   * define global constants for source code, like webpack
   */
  define?: Record<string, string>;

  /**
   * configure module resolve alias, like webpack
   */
  alias?: Record<string, string>;

  /**
   * configure postcss
   * @todo  real type definition
   */
  postcssOptions?: any;

  /**
   * configure autoprefixer
   * @todo  real type definition
   */
  autoprefixer?: any;

  /**
   * configure extra babel presets
   * @todo  real type definition
   */
  extraBabelPresets?: any[];

  /**
   * configure extra babel plugins
   * @todo  real type definition
   */
  extraBabelPlugins?: any[];
}

export interface IFatherTransformerConfig {
  /**
   * source code directory
   * @default src
   */
  input?: string;

  /**
   * output directory
   * @default es
   */
  output?: string;

  /**
   * specific transformer
   * @default auto (babel for browser files, esbuild for node files)
   */
  transformer?: string;

  /**
   * override config for each sub-directory or file via key-value
   */
  overrides?: Record<
    string,
    Omit<IFatherTransformerConfig, 'input'> & IFatherBaseConfig
  >;

  /**
   * ignore specific directories & files via ignore syntax
   */
  ignores?: string[];
}

export interface IFatherBundlerConfig {
  /**
   * bundle entry config
   * @default src/index.{js,ts,jsx,tsx}
   * @note    support to override config for each entry via key-value
   */
  entry?:
    | string
    | Record<string, Omit<IFatherBundlerConfig, 'entry'> & IFatherBaseConfig>;

  /**
   * bundle output path
   * @default dist
   */
  output?: string;

  /**
   * external dependencies
   * @note  like umi externals
   */
  externals?: Record<string, string>;

  /**
   * extract css to a single file
   */
  extractCSS?: boolean;

  /**
   * extra webpack plugins
   * @todo  real type definition
   */
  extraWebpackPlugins?: any[];

  /**
   * modify webpack config via webpack-chain
   * @todo  real type definition
   */
  chainWebpack?: (args: any) => any;
}

export interface IFatherConfig extends IFatherBaseConfig {
  /**
   * bundler config (umd)
   */
  umd?: IFatherBundlerConfig;

  /**
   * transformer config (esm)
   */
  esm?: IFatherTransformerConfig;

  /**
   * cjs
   * @deprecated
   */
  cjs?: IFatherTransformerConfig;
}
