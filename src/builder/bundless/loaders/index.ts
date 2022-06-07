import fs from 'fs';
import { runLoaders } from 'loader-runner';
import { IApi } from '../../../types';
import { IBundlessConfig } from '../../config';

/**
 * loader item type
 */
export interface ILoaderItem {
  id: string;
  test: string | RegExp | ((path: string) => boolean);
  loader: string;
  options?: Record<string, any>;
}

const loaders: ILoaderItem[] = [];

/**
 * add loader
 * @param item  loader item
 */
export function addLoader(item: ILoaderItem) {
  // only support simple test type currently, because the webpack condition is too complex
  // refer: https://github.com/webpack/webpack/blob/0f6c78cca174a73184fdc0d9c9c2bd376b48557c/lib/rules/RuleSetCompiler.js#L211
  if (
    !['string', 'function'].includes(typeof item.test) &&
    !(item.test instanceof RegExp)
  ) {
    throw new Error(
      `Unsupported loader test in \`${item.id}\`, only string, function and regular expression are available.`,
    );
  }

  loaders.push(item);
}

/**
 * loader module base on webpack loader-runner
 */
export default async (
  fileAbsPath: string,
  opts: { config: IBundlessConfig; pkg: IApi['pkg'] },
) => {
  // get matched loader by test
  const matched = loaders.find((item) => {
    switch (typeof item.test) {
      case 'string':
        return fileAbsPath.startsWith(item.test);

      case 'function':
        return item.test(fileAbsPath);

      default:
        // assume it is RegExp instance
        return item.test.test(fileAbsPath);
    }
  });

  if (matched) {
    // run matched loader
    return new Promise<string | undefined>((resolve, reject) => {
      runLoaders(
        {
          resource: fileAbsPath,
          loaders: [{ loader: matched.loader, options: matched.options }],
          context: { config: opts.config, pkg: opts.pkg },
          readResource: fs.readFile.bind(fs),
        },
        (err, { result }) => {
          if (err) {
            reject(err);
          } else if (result) {
            // FIXME: handle buffer type?
            resolve(result[0] as unknown as string);
          } else {
            resolve(void 0);
          }
        },
      );
    });
  }
};
