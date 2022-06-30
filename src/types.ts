import type { Compiler } from '@umijs/bundler-webpack';
import type Autoprefixer from '@umijs/bundler-webpack/compiled/autoprefixer';
import type IWebpackChain from '@umijs/bundler-webpack/compiled/webpack-5-chain';
import type { IConfig as IBundlerWebpackConfig } from '@umijs/bundler-webpack/dist/types';
import type { IServicePluginAPI, PluginAPI } from '@umijs/core';
import type { ITransformerItem } from './builder/bundless/loaders/javascript';

export type {
  IBundlessLoader,
  IJSTransformer,
} from './builder/bundless/loaders/types';

export type IApi = PluginAPI &
  IServicePluginAPI & {
    /**
     * add bundless js transformer
     */
    addJSTransformer: (item: ITransformerItem) => void;
  };

export enum IFatherBuildTypes {
  BUNDLE = 'bundle',
  BUNDLESS = 'bundless',
}

export enum IFatherJSTransformerTypes {
  BABEL = 'babel',
  ESBUILD = 'esbuild',
}

export enum IFatherPlatformTypes {
  NODE = 'node',
  BROWSER = 'browser',
}

export enum IFatherBundlessTypes {
  ESM = 'esm',
  CJS = 'cjs',
}

export interface IFatherBaseConfig {
  /**
   * compile platform
   * @default browser
   */
  platform?: `${IFatherPlatformTypes}`;

  /**
   * define global constants for source code, like webpack
   */
  define?: Record<string, string>;

  /**
   * configure module resolve alias, like webpack
   */
  alias?: Record<string, string>;

  /**
   * configure extra babel presets
   */
  extraBabelPresets?: IBundlerWebpackConfig['extraBabelPresets'];

  /**
   * configure extra babel plugins
   */
  extraBabelPlugins?: IBundlerWebpackConfig['extraBabelPlugins'];
}

export interface IFatherBundlessConfig extends IFatherBaseConfig {
  /**
   * source code directory
   * @default src
   */
  input?: string;

  /**
   * output directory
   */
  output?: string;

  /**
   * specific transformer
   * @note  father will auto-select transformer by default (babel for browser files, esbuild for node files)
   */
  transformer?: `${IFatherJSTransformerTypes}`;

  /**
   * override config for each sub-directory or file via key-value
   */
  overrides?: Record<
    string,
    Omit<IFatherBundlessConfig, 'input'> & IFatherBaseConfig
  >;

  /**
   * ignore specific directories & files via ignore syntax
   */
  ignores?: string[];
}

export interface IFatherBundleConfig extends IFatherBaseConfig {
  /**
   * bundle entry config
   * @default src/index.{js,ts,jsx,tsx}
   * @note    support to override config for each entry via key-value
   */
  entry?:
    | string
    | Record<string, Omit<IFatherBundleConfig, 'entry'> & IFatherBaseConfig>;

  /**
   * bundle output path
   * @default dist/umd
   */
  output?: string;

  /**
   * external dependencies
   * @note  like umi externals
   */
  externals?: Record<string, string>;

  /**
   * modify webpack config via webpack-chain
   */
  chainWebpack?: (
    memo: IWebpackChain,
    args: { env: string; webpack: Compiler['webpack'] },
  ) => IWebpackChain;

  /**
   * configure postcss
   */
  postcssOptions?: IBundlerWebpackConfig['postcssLoader'];

  /**
   * configure autoprefixer
   */
  autoprefixer?: Autoprefixer.Options;
}

export interface IFatherPreBundleConfig {
  /**
   * output directory
   * @default compiled
   */
  output?: string;
  /**
   * dependencies or entries need to be pre-bundled
   */
  deps: string[] | Record<string, { minify?: boolean; dts?: boolean }>;

  /**
   * extra dep declarations need to be pre-bundled
   */
  extraDtsDeps?: string[];

  /**
   * extra dependencies & declarations need to be externalized
   * @note  all deps & package.json dependencies will be added to externals by default
   */
  extraExternals?: Record<string, string>;
}

export interface IFatherConfig extends IFatherBaseConfig {
  extends?: string;

  /**
   * bundler config (umd)
   */
  umd?: IFatherBundleConfig;

  /**
   * transformer config (esm)
   */
  esm?: IFatherBundlessConfig & {
    /**
     * output directory
     * @default dist/esm
     */
    output?: string;
  };

  /**
   * transformer config (cjs)
   */
  cjs?: IFatherBundlessConfig & {
    /**
     * output directory
     * @default dist/cjs
     */
    output?: string;
  };

  /**
   * deps pre-bundle config
   */
  prebundle?: IFatherPreBundleConfig;
}
