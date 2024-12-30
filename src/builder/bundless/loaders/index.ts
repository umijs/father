import { chalk, winPath } from '@umijs/utils';
import fs from 'fs';
import { runLoaders } from 'loader-runner';
import path from 'path';
import type { IApi } from '../../../types';
import { getCache, logger } from '../../../utils';
import type { IBundlessConfig } from '../../config';
import { getContentHash } from '../../utils';
import { getTsconfig } from '../dts';
import type { IBundlessLoader, ILoaderOutput } from './types';

import type { Loaders, Transformers } from '..';

export interface ILoaderArgs {
  fileAbsPath: string;
  loaders: Loaders;
  fileDistPath: string;
  transformers: Transformers;
  opts: {
    config: IBundlessConfig;
    pkg: IApi['pkg'];
    cwd: string;
    itemDistAbsPath: string;
  };
}

function replacePathExt(filePath: string, ext: string) {
  const parsed = path.parse(filePath);

  return path.join(parsed.dir, `${parsed.name}${ext}`);
}

function dealResult(result: any, args: ILoaderArgs) {
  let fileDistAbsPath = args.opts.itemDistAbsPath;
  if (result) {
    // update ext if loader specified
    if (result.options.ext) {
      fileDistAbsPath = replacePathExt(
        args.opts.itemDistAbsPath,
        result.options.ext,
      );
    }

    if (result.options.map) {
      const map = result.options.map;
      const mapLoc = `${fileDistAbsPath}.map`;

      fs.writeFileSync(mapLoc, map);
    }

    // distribute file with result
    fs.writeFileSync(fileDistAbsPath, result.content);
  } else {
    // copy file as normal assets
    fs.copyFileSync(args.fileAbsPath, fileDistAbsPath);
  }
  logger.quietExpect.event(
    `Bundless ${chalk.gray(path.basename(args.fileAbsPath))} to ${chalk.gray(
      replacePathExt(args.fileDistPath, result.options.ext),
    )}${result?.options.declaration ? ' (with declaration)' : ''}`,
  );
  // prepare for declaration
  if (result.options.declaration) {
    // use winPath because ts compiler will convert to posix path
    return [winPath(args.fileAbsPath), path.dirname(fileDistAbsPath)];
  }
}

/**
 * loader module base on webpack loader-runner
 */
export default async (args: ILoaderArgs) => {
  const cache = getCache('bundless-loader');
  // format: {path:contenthash:config:pkgDeps}
  const cacheKey = [
    args.fileAbsPath,
    getContentHash(fs.readFileSync(args.fileAbsPath, 'utf-8')),
    JSON.stringify(args.opts.config),
    // use for babel opts generator in src/builder/utils.ts
    JSON.stringify(
      Object.assign(
        {},
        args.opts.pkg.dependencies,
        args.opts.pkg.peerDependencies,
      ),
    ),
  ].join(':');
  const cacheRet = await cache.get(cacheKey, '');

  // use cache first
  /* istanbul ignore if -- @preserve */
  if (cacheRet) {
    const tsconfig = /\.tsx?$/.test(args.fileAbsPath)
      ? getTsconfig(args.opts.cwd)
      : undefined;
    const declaration = dealResult(
      {
        ...cacheRet,
        options: {
          ...cacheRet.options,
          // FIXME: shit code for avoid invalid declaration value when tsconfig changed
          declaration:
            tsconfig?.options.declaration &&
            tsconfig?.fileNames.includes(winPath(args.fileAbsPath)),
        },
      },
      args,
    );
    return Promise.resolve(declaration);
  }

  // get matched loader by test
  const matched = args.loaders.find((item) => {
    switch (typeof item.test) {
      case 'string':
        return args.fileAbsPath.startsWith(item.test);

      case 'function':
        return item.test(args.fileAbsPath);

      default:
        // assume it is RegExp instance
        return item.test.test(args.fileAbsPath);
    }
  });

  if (matched) {
    // run matched loader
    return new Promise<ILoaderOutput | void | string[]>((resolve, reject) => {
      let outputOpts: ILoaderOutput['options'] = {};
      runLoaders(
        {
          resource: args.fileAbsPath,
          loaders: [{ loader: matched.loader, options: matched.options }],
          context: {
            cwd: args.opts.cwd,
            config: args.opts.config,
            transformers: args.transformers,
            pkg: args.opts.pkg,
            itemDistAbsPath: args.opts.itemDistAbsPath,
            setOutputOptions(opts) {
              outputOpts = opts;
            },
          } as Partial<ThisParameterType<IBundlessLoader>>,
          readResource: fs.readFile.bind(fs),
        },
        (err, { result }) => {
          if (err) {
            reject(err);
          } else if (result) {
            // FIXME: handle buffer type?
            const ret = {
              content: result[0] as unknown as string,
              options: outputOpts,
            };

            // save cache then resolve
            cache.set(cacheKey, ret).then(() => {
              const declaration = dealResult(ret, args);
              resolve(declaration);
            });
          } else {
            resolve(void 0);
          }
        },
      );
    });
  } else {
    fs.copyFileSync(args.fileAbsPath, args.opts.itemDistAbsPath);
  }
};
