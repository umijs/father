import {
  IConfig as IConfigCore,
  IRoute,
  PluginAPI,
  Service,
} from '@umijs/core';
import { Generator } from '@umijs/utils';

interface IEvent<T> {
  (fn: { (args: T): void }): void;
  (args: { fn: { (args: T): void }; before?: string; stage?: number }): void;
}

interface IModify<T, U> {
  (fn: { (initialValue: T, args: U): T }): void;
  (fn: { (initialValue: T, args: U): Promise<T> }): void;
  (args: {
    fn: { (initialValue: T, args: U): T };
    before?: string;
    stage?: number;
  }): void;
  (args: {
    fn: { (initialValue: T, args: U): Promise<T> };
    before?: string;
    stage?: number;
  }): void;
}

interface IAdd<T, U> {
  (fn: { (args: T): U | U[] }): void;
  (fn: { (args: T): Promise<U | U[]> }): void;
  (args: { fn: { (args: T): U | U[] }; before?: string; stage?: number }): void;
  (args: {
    fn: { (args: T): Promise<U | U[]>; before?: string; stage?: number };
  }): void;
}

interface IGetter<T> {
  (): T;
}

interface IImport {
  source: string;
  specifier?: string;
}

export interface ITargets {
  browsers?: any;
  [key: string]: number | boolean;
}

interface ICreateCSSRule {
  (opts: {
    lang: string;
    test: RegExp;
    loader?: string;
    options?: object;
  }): void;
}

type IPresetOrPlugin = string | [string, any];
type IBabelPresetOrPlugin = string | Function | [string, any, string?];
type env = 'development' | 'production';

export interface IApi extends PluginAPI {
  // properties
  paths: typeof Service.prototype.paths;
  cwd: typeof Service.prototype.cwd;
  userConfig: typeof Service.prototype.userConfig;
  config: IConfig;
  pkg: typeof Service.prototype.pkg;
  env: typeof Service.prototype.env;
  args: typeof Service.prototype.args;

  // methods
  applyPlugins: typeof Service.prototype.applyPlugins;
  ApplyPluginsType: typeof Service.prototype.ApplyPluginsType;
  ConfigChangeType: typeof Service.prototype.ConfigChangeType;
  EnableBy: typeof Service.prototype.EnableBy;
  stage: typeof Service.prototype.stage;
  ServiceStage: typeof Service.prototype.ServiceStage;
  writeTmpFile: { (args: { path: string; content: string }): void };
  registerGenerator: { (args: { key: string; Generator: Generator }): void };
  babelRegister: typeof Service.prototype.babelRegister;
  getRoutes: () => Promise<IRoute[]>;
  hasPlugins: typeof Service.prototype.hasPlugins;
  hasPresets: typeof Service.prototype.hasPresets;

  // ApplyPluginType.event
  onPluginReady: IEvent<null>;
  onStart: IEvent<{ args: object }>;
  onExit: IEvent<{ signal: 'SIGINT' | 'SIGQUIT' | 'SIGTERM' }>;

  // ApplyPluginType.modify
  modifyConfig: IModify<IConfig, {}>;
  modifyDefaultConfig: IModify<IConfig, {}>;

  // ApplyPluginType.add
}

export interface IConfig extends IConfigCore {
  /**
   * output runtime & version targets
   * @note  default behaviors:
   *          - recognize build platform automatically
   *          - enable autoprefixer for browser targets
   */
  targets: { [key: string]: string | number };
  /**
   * extra files for different platform
   */
  browserFiles?: string[];
  nodeFiles?: string[];

  // module types
  /**
   * esm module type
   */
  esm?: {
    type: 'babel' | 'rollup';
    mjs?: boolean;
    minify?: boolean;
    importLibToEs?: boolean;
  };
  /**
   * cjs module type
   */
  cjs?: {
    type: 'babel' | 'rollup';
    minify?: boolean;
    lazy?: boolean;
  };
  /**
   * umd module type
   */
  umd?: {
    name?: string;
    minFile?: boolean;
    sourcemap?: boolean;
    globals?: { [key: string]: string };
  };

  // compile modes
  /**
   * babel compile mode
   */
  babel?: {
    runtimeHelpers?: boolean;
    plugins?: IBabelPresetOrPlugin[];
    presets?: IBabelPresetOrPlugin[];
  };
  /**
   * rollup compile mode
   */
  rollup?: {
    entry?: {
      [key: string]: string;
    };
    /**
     * extract CSS into single file, styles will be inject <head> if it is false or unset
     */
    extractCSS?: boolean;
    /**
     * external or exclude external some dependencies
     * @note  usage:
     *          - ['pkg']  for external
     *          - ['!pkg'] for exclude external
     */
    externals?: string[];
    /**
     * babel configs, use babel mode configs by default
     */
    babelRuntimeHelpers?: boolean;
    babelPlugins?: IBabelPresetOrPlugin[];
    babelPresets?: IBabelPresetOrPlugin[];
    /**
     * @rollup/plugin-inject
     */
    inject?: { [key: string]: string };
    /**
     * @rollup/plugin-replace
     */
    replace?: { [key: string]: string };
    /**
     * @rollup/plugin-commonjs
     */
    commonjs?: any;
    /**
     * @rollup/plugin-node-resolve
     */
    resolve?: any;
    plugins?: any[];
  };

  /**
   * Post CSS configs
   */
  postCSS?: {
    plugins?: [];
    less?: any;
    sass?: any;
  };

  [key: string]: any;
}
