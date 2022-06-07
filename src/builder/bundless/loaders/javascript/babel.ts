import {
  transform as babelTransform,
  TransformOptions,
} from '@umijs/bundler-utils/compiled/babel/core';
import path from 'path';
import { IApi, IFatherJSTransformerTypes } from '../../../../types';
import type { IBundlessConfig } from '../../../config';

/**
 * babel transformer
 */
class BabelTransformer {
  static id = IFatherJSTransformerTypes.BABEL;

  config: TransformOptions;

  constructor(opts: {
    config: IBundlessConfig;
    cwd: string;
    fileAbsPath: string;
    pkg: IApi['pkg'];
  }) {
    this.config = this.getBabelConfig(opts);
  }

  getBabelConfig(
    opts: ConstructorParameters<typeof BabelTransformer>[0],
  ): TransformOptions {
    const {
      extraBabelPlugins,
      extraBabelPresets,
      define,
      alias = {},
    } = opts.config;

    // transform alias to relative path for babel-plugin-module-resolver
    Object.keys(alias).forEach((key) => {
      if (path.isAbsolute(alias[key])) {
        alias[key] = path.relative(opts.cwd, alias[key]);

        // prefix . for same-level path
        if (!alias[key].startsWith('.')) {
          alias[key] = `.${path.sep}${alias[key]}`;
        }
      }
    });

    return {
      filename: opts.fileAbsPath,
      presets: [
        [
          require.resolve('@umijs/babel-preset-umi'),
          {
            presetEnv: {},
            presetReact: {},
            presetTypeScript: {},
            pluginTransformRuntime: {
              absoluteRuntime: false,
              version: opts.pkg.dependencies?.['@babel/runtime'],
            },
          },
        ],
        ...(extraBabelPresets ? extraBabelPresets : []),
      ],
      plugins: [
        [require.resolve('babel-plugin-transform-define'), define || {}],
        [
          require.resolve('babel-plugin-module-resolver'),
          {
            alias: alias,
            cwd: opts.cwd,
            extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
          },
        ],
        ...(extraBabelPlugins ? extraBabelPlugins : []),
      ].filter(Boolean),
    };
  }

  process(content: string) {
    return babelTransform(content, this.config)?.code;
  }
}

export default BabelTransformer;
