import { transform } from '@umijs/bundler-utils/compiled/babel/core';
import { winPath } from '@umijs/utils';
import path from 'path';
import { IFatherBundlessTypes, IFatherPlatformTypes } from '../../../../types';
import {
  addSourceMappingUrl,
  ensureRelativePath,
  getBabelPresetReactOpts,
} from '../../../utils';
import type { IJSTransformer } from '../types';

/**
 * parse for stringify define value, use to babel-plugin-transform-define
 */
function getParsedDefine(define: Record<string, string>) {
  return Object.entries(define).reduce<typeof define>(
    (result, [name, value]) => ({
      ...result,
      [name]: JSON.parse(value),
    }),
    {},
  );
}

/**
 * babel transformer
 */
const babelTransformer: IJSTransformer = function (content) {
  const {
    extraBabelPlugins = [],
    extraBabelPresets = [],
    define,
    alias: oAlias = {},
  } = this.config;
  // TODO: correct optional in umi types and replace any here
  const presetOpts: any = {
    presetEnv: {
      targets:
        typeof this.config.targets === 'object'
          ? this.config.targets
          : this.config.platform === IFatherPlatformTypes.BROWSER
          ? { ie: 11 }
          : { node: 14 },
      modules: this.config.format === IFatherBundlessTypes.ESM ? false : 'auto',
    },
    presetReact: getBabelPresetReactOpts(this.pkg),
    presetTypeScript: {},
  };

  // transform alias to relative path for babel-plugin-module-resolver
  const alias = Object.entries(oAlias).reduce<typeof oAlias>(
    (result, [name, target]) => {
      if (path.isAbsolute(target)) {
        result[name] = winPath(path.relative(this.paths.cwd, target));
        result[name] = ensureRelativePath(result[name]);
      } else {
        result[name] = target;
      }

      return result;
    },
    {},
  );

  if (this.pkg.dependencies?.['@babel/runtime']) {
    presetOpts.pluginTransformRuntime = {
      absoluteRuntime: false,
      // still use legacy esm helpers, to avoid double imports of runtime helpers
      // from webpack 4 bundlers, such as Umi 3, antd-tools & etc.
      useESModules:
        this.config.format === IFatherBundlessTypes.ESM ? true : false,
      version: this.pkg.dependencies?.['@babel/runtime'],
    };
  }
  // TODO: recommend install @babel/runtime in doctor
  const { code, map } = transform(content, {
    filename: this.paths.fileAbsPath,
    cwd: this.paths.cwd,
    babelrc: false,
    sourceMaps: this.config.sourcemap,
    sourceFileName: this.config.sourcemap
      ? path.relative(
          path.dirname(this.paths.itemDistAbsPath),
          this.paths.fileAbsPath,
        )
      : undefined,
    presets: [
      [require.resolve('@umijs/babel-preset-umi'), presetOpts],
      ...extraBabelPresets,
    ],
    plugins: [
      [
        require.resolve('babel-plugin-module-resolver'),
        {
          alias: alias,
          cwd: this.paths.cwd,
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.json'],
        },
      ],
      ...(define
        ? [
            [
              require.resolve('babel-plugin-transform-define'),
              getParsedDefine(define),
            ],
          ]
        : []),
      ...extraBabelPlugins,
    ],
  })!;
  if (map) {
    return [
      addSourceMappingUrl(code!, this.paths.itemDistAbsPath),
      JSON.stringify(map),
    ];
  }
  return [code!];
};

export default babelTransformer;
