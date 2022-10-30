import {
  build,
  type OnResolveArgs,
} from '@umijs/bundler-utils/compiled/esbuild';
import fs from 'fs';
import path from 'path';
import { getCache } from '../utils';

export type IDoctorSourceParseResult = {
  imports: Omit<OnResolveArgs, 'pluginData'>[];
};

export default async (
  fileAbsPath: string,
): Promise<IDoctorSourceParseResult> => {
  const cache = getCache('doctor-parser');
  // format: {path:mtime}
  const cacheKey = [fileAbsPath, fs.statSync(fileAbsPath).mtimeMs].join(':');
  const cacheRet = cache.getSync(cacheKey, '');
  const ret: IDoctorSourceParseResult = { imports: [] };

  if (cacheRet) return cacheRet;

  await build({
    // do not emit file
    write: false,
    // enable bundle for trigger onResolve hook, but all deps will be externalized
    bundle: true,
    logLevel: 'silent',
    format: 'esm',
    target: 'esnext',
    // esbuild need relative entry path
    entryPoints: [path.basename(fileAbsPath)],
    absWorkingDir: path.dirname(fileAbsPath),
    plugins: [
      {
        name: 'plugin-father-doctor',
        setup: (builder) => {
          builder.onResolve({ filter: /.*/ }, ({ pluginData, ...args }) => {
            if (args.kind !== 'entry-point') {
              ret.imports.push(args);

              return {
                path: args.path,
                // make all deps external
                external: true,
              };
            }
          });

          // TODO: support collect imports from style style pre-processor files
          builder.onLoad({ filter: /\.(less|scss|sass|styl)$/ }, () => {
            // omit all style pre-processor files to avoid esbuild report no loader error
            return { contents: '', loader: 'css' };
          });

          // omit non-js files(such as svg), to avoid throw error
          builder.onLoad(
            { filter: /.(svg|png|jpg|jpeg|gif|woff|woff2|ttf|eot|mp3|mp4)$/ },
            () => {
              return { contents: '', loader: 'text' };
            },
          );
        },
      },
    ],
    supported: {
      'regexp-lookbehind-assertions': true,
    },
  });

  cache.set(cacheKey, ret);

  return ret;
};
