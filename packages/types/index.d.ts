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
  cjs?: {
    type: 'rollup' | 'babel';
  };
  esm?: {
    type: 'rollup' | 'babel';
  };
  extraBabelPlugins?: IBabelPresetOrPlugin[];
  extraBabelPresets?: IBabelPresetOrPlugin[];
  extraPostCSSPlugins?: any[];
  lessInBabelMode?: object;
  plugins?: IPresetOrPlugin[];
  presets?: IPresetOrPlugin[];
  target?: 'browser' | 'node';
  umd?: {
    type: 'rollup' | 'webpack';
  };
  [key: string]: any;
}
