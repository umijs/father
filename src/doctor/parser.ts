import {
  build,
  type OnResolveArgs,
} from '@umijs/bundler-utils/compiled/esbuild';
import fs from 'fs';
import path from 'path';
import { getContentHash } from '../builder/utils';
import { getCache } from '../utils';

export type IDoctorSourceParseResult = {
  imports: Omit<OnResolveArgs, 'pluginData'>[];
};

export default async (
  fileAbsPath: string,
): Promise<IDoctorSourceParseResult> => {
  const cache = getCache('doctor-parser');
  // format: {path:contenthash}
  const cacheKey = [
    fileAbsPath,
    getContentHash(fs.readFileSync(fileAbsPath, 'utf-8')),
  ].join(':');
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
        },
      },
    ],
  });

  await cache.set(cacheKey, ret);

  return ret;
};
