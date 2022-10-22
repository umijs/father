import type { Plugin } from '@umijs/bundler-utils/compiled/esbuild';
import { build } from '@umijs/bundler-utils/compiled/esbuild';
import { winPath } from '@umijs/utils';
import path from 'path';
import { IFatherBundlessConfig, IFatherPlatformTypes } from '../../../../types';
import type { IJSTransformer } from '../types';

/**
 * create a replacer for transform alias path to relative path
 */
function createAliasReplacer(opts: { alias: IFatherBundlessConfig['alias'] }) {
  const alias = opts.alias || {};

  return function replacer(context: string, request: string) {
    let absReq = '';

    for (const rule in alias) {
      // replace prefix
      if (request.startsWith(`${rule}/`)) {
        absReq = path.join(alias[rule], request.slice(rule.length + 1));
        break;
      }

      // replace full path
      if (request === rule) {
        absReq = alias[rule];
        break;
      }
    }

    // transform to relative path
    if (absReq) {
      const rltReq = winPath(path.relative(context, absReq));

      return rltReq.startsWith('..') ? rltReq : `./${rltReq}`;
    }

    return request;
  };
}

/**
 * esbuild transformer
 */
const esbuildTransformer: IJSTransformer = async function () {
  const replacer = createAliasReplacer({ alias: this.config.alias });
  const { aliasPlugin = true, ...extraOptions } = this.config.esbuild || {};
  const plugins = [
    ...(aliasPlugin
      ? [
          {
            name: 'plugin-father-alias',
            setup: (builder) => {
              builder.onResolve({ filter: /.*/ }, (args) => {
                if (args.kind === 'entry-point') {
                  // skip entry point
                  return { path: path.join(args.resolveDir, args.path) };
                } else if (args.path.startsWith('.')) {
                  // skip relative module
                  return { path: args.path, external: true };
                }

                // try to replace alias to relative path
                return {
                  path: replacer(args.resolveDir, args.path),
                  external: true,
                };
              });
            },
          } as Plugin,
        ]
      : []),
    ...(extraOptions.plugins || []),
  ];

  let { outputFiles } = await build({
    // enable bundle for trigger onResolve hook, but all deps will be externalized
    bundle: true,
    // write false will not write file to file system，but sourcemap need this to get sources
    outdir: path.relative(
      this.paths.cwd,
      path.dirname(this.paths.itemDistAbsPath),
    ),
    sourcemap: this.config.sourcemap && 'linked',
    logLevel: 'silent',
    format: this.config.format,
    define: this.config.define,
    platform: this.config.platform,
    target:
      this.config.platform === IFatherPlatformTypes.NODE ? 'node14' : 'es6',
    // esbuild need relative entry path
    entryPoints: [path.relative(this.paths.cwd, this.paths.fileAbsPath)],
    absWorkingDir: this.paths.cwd,
    ...extraOptions,
    plugins,
    // do not emit file
    write: false,
  });

  if (outputFiles.length === 2) {
    const [map, result] = outputFiles;
    return [result.text, map.text];
  }

  return [outputFiles[0].text];
};

export default esbuildTransformer;
