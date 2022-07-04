import { pkgUp } from '@umijs/utils';
import path from 'path';
import { IApi } from './types';

/**
 * get valid type field value from package.json
 */
export function getTypeFromPkgJson(pkg: IApi['pkg']): string | undefined {
  return pkg.types || pkg.typing || pkg.typings;
}

/**
 * get d.ts file path and package path for NPM package.json path
 */
export function getDtsInfoForPkgPath(pkgPath: string) {
  const pkg = require(pkgPath);
  const info = { pkgPath: pkgPath, dtsPath: getTypeFromPkgJson(pkg)! };

  if (info.dtsPath) {
    // resolve builtin types
    info.dtsPath = path.resolve(path.dirname(pkgPath), info.dtsPath);
  } else {
    // resolve @types/xxx pkg
    try {
      info.pkgPath = require.resolve(
        `@types/${pkg.name.replace('@', '').replace('/', '__')}/package.json`,
        { paths: [pkgPath] },
      );
      info.dtsPath = path.resolve(
        path.dirname(info.pkgPath),
        getTypeFromPkgJson(require(info.pkgPath))!,
      );
    } catch {
      return null;
    }
  }

  return info;
}

/**
 * get package.json path for specific NPM package
 * @see https://github.com/nodejs/node/issues/33460
 */
export function getDepPkgPath(dep: string, cwd: string) {
  return pkgUp.pkgUpSync({
    cwd: require.resolve(`${dep}/package.json`, { paths: [cwd] }),
  })!;
}

/**
 * get all nested dependencies for specific NPM package
 */
export function getNestedDepsForPkg(
  name: string,
  cwd: string,
  externals: Record<string, string>,
  deps: Record<string, string> = {},
) {
  if (name in deps || externals[name]) return deps;

  const pkgPath = getDepPkgPath(name, cwd);
  const pkgJson = require(pkgPath);
  const pkgDeps: typeof deps = pkgJson.dependencies || {};

  deps[name] = pkgJson.version;
  Object.keys(pkgDeps).forEach((name) => {
    getNestedDepsForPkg(name, pkgPath, externals, deps);
  });

  return deps;
}
