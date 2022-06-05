import {
  transform as babelTransform,
  TransformOptions,
} from '@umijs/bundler-utils/compiled/babel/core';
import {
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../../../../types';
import type { IBundlessConfig } from '../../../config';
import resolvePath from './resolvePath';

/**
 * babel transformer
 */
class BabelTransformer {
  static id = IFatherJSTransformerTypes.BABEL;

  config = {} as TransformOptions;

  constructor(config: IBundlessConfig) {
    // TODO: create babel instance from config
    this.config = this.getBabelConfig(config);
  }

  getBabelConfig(config: IBundlessConfig): TransformOptions {
    const { platform, extraBabelPlugins, extraBabelPresets, define, alias } =
      config;
    const isBrowser = platform === IFatherPlatformTypes.BROWSER;

    return {
      presets: [
        [
          require.resolve('@umijs/babel-preset-umi'),
          {
            presetEnv: {},
            presetReact: {},
            presetTypeScript: {},
            pluginTransformRuntime: {},
            pluginLockCoreJS: {},
            pluginAutoCSSModules: false,
            pluginDynamicImportNode: false,
          },
        ],
        ...(extraBabelPresets ? extraBabelPresets : []),
      ],
      plugins: [
        [require.resolve('babel-plugin-transform-define'), define || {}],
        isBrowser && [require.resolve('babel-plugin-react-require')],
        [
          require.resolve('babel-plugin-module-resolver'),
          {
            alias: alias || {},
            resolvePath,
          },
        ],
        ...(extraBabelPlugins ? extraBabelPlugins : []),
      ].filter(Boolean),
    };
  }

  process(content: string, fileAbsPath: string) {
    const config = this.config;

    return babelTransform(content, {
      filename: fileAbsPath,
      ...config,
    })?.code;
  }
}

export default BabelTransformer;
