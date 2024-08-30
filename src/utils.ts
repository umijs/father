import { chalk, pkgUp, logger as umiLogger } from '@umijs/utils';
import Cache from 'file-system-cache';
import { builtinModules } from 'module';
import path, { isAbsolute } from 'path';
import { DEFAULT_CACHE_PATH } from './constants';
import { IApi } from './types';

const caches: Record<string, ReturnType<typeof Cache>> = {};

/**
 * get cache path
 */
export function getCachePath() {
  return process.env.FATHER_CACHE_DIR || DEFAULT_CACHE_PATH;
}

/**
 * get file-system cache for specific namespace
 */
export function getCache(ns: string): (typeof caches)['0'] {
  // return fake cache if cache disabled
  if (process.env.FATHER_CACHE === 'none') {
    const deferrer = () => Promise.resolve();
    return { set: deferrer, get: deferrer, setSync() {}, getSync() {} } as any;
  }
  return (caches[ns] ??= Cache({ basePath: path.join(getCachePath(), ns) }));
}

/**
 * get valid type field value from package.json
 */
export function getTypeFromPkgJson(pkg: IApi['pkg']): string | undefined {
  return pkg.types || pkg.typing || pkg.typings;
}

/**
 * restore xxx for @types/xxx
 */
export function getPkgNameFromTypesOrg(name: string) {
  return name.replace('@types/', '').replace(/^([^]+?)__([^]+)$/, '@$1/$2');
}

/**
 * get @types/xxx for xxx
 */
export function getPkgNameWithTypesOrg(name: string) {
  return `@types/${name.replace('@', '').replace('/', '__')}`;
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
        `${getPkgNameWithTypesOrg(pkg.name)}/package.json`,
        {
          paths: [pkgPath],
        },
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
 * Determine if it is a native module
 */
export const isBuiltInModule = (pkgName: string) =>
  builtinModules.includes(pkgName.replace(/^node:/, ''));

/**
 * get package.json path for specific NPM package
 * @see https://github.com/nodejs/node/issues/33460
 */
export function getDepPkgPath(dep: string, cwd: string) {
  try {
    return require.resolve(`${dep}/package.json`, { paths: [cwd] });
  } catch {
    return pkgUp.pkgUpSync({
      cwd: require.resolve(dep, { paths: [cwd] }),
    })!;
  }
}

/**
 * get all nested type dependencies for specific NPM package
 */
export function getNestedTypeDepsForPkg(
  name: string,
  cwd: string,
  externals: Record<string, string>,
  deps?: Record<string, string>,
) {
  const isWithinTypes = name.startsWith('@types/');
  const pkgName = isWithinTypes ? getPkgNameFromTypesOrg(name) : name;
  const typesPkgName = isWithinTypes ? name : getPkgNameWithTypesOrg(name);
  const isCollected =
    deps?.hasOwnProperty(name) || deps?.hasOwnProperty(typesPkgName);
  const isExternalized = externals[pkgName] || externals[typesPkgName];

  if (deps && (isCollected || isExternalized)) return deps;

  const isTopLevel = !deps;
  const dtsInfo = getDtsInfoForPkgPath(getDepPkgPath(name, cwd));
  const pkgJson = dtsInfo ? require(dtsInfo.pkgPath) : {};
  const pkgDeps: NonNullable<typeof deps> = pkgJson.dependencies || {};

  // collect nested packages and exclude self
  deps ??= {};
  Object.assign(deps, isTopLevel ? {} : { [pkgJson.name]: pkgJson.version });
  Object.keys(pkgDeps).forEach((item) => {
    getNestedTypeDepsForPkg(item, dtsInfo!.pkgPath, externals, deps);
  });

  return deps;
}

/**
 * wrap umi logger for quiet & timestamp
 */
type IUmiLogger = typeof umiLogger;
type IFatherLogger = IUmiLogger & {
  quietOnly: IUmiLogger;
  quietExpect: IUmiLogger;
  setQuiet: (quiet: boolean) => void;
  _quiet: boolean;
};
export const logger: Omit<IFatherLogger, '_quiet'> = new Proxy<IFatherLogger>(
  {} as IFatherLogger,
  {
    get(target, prop: keyof typeof logger, receiver) {
      // implement setQuiet
      if (prop === 'setQuiet') {
        return (quiet: boolean) => {
          target._quiet = quiet;
        };
      }

      // implement quietOnly
      if (prop === 'quietOnly') {
        return new Proxy(
          {},
          {
            get: (_, prop: keyof IFatherLogger) => {
              return target._quiet
                ? this.get!(target, prop, receiver)
                : () => {};
            },
          },
        );
      }

      // implement quietExpect
      if (prop === 'quietExpect') {
        return new Proxy(
          {},
          {
            get: (_, prop: keyof IFatherLogger) => {
              return target._quiet
                ? () => {}
                : this.get!(target, prop, receiver);
            },
          },
        );
      }

      // prefix time for development
      if (
        prop in umiLogger.prefixes &&
        process.env.NODE_ENV === 'development'
      ) {
        return umiLogger[prop as keyof typeof umiLogger.prefixes].bind(
          umiLogger,
          chalk.gray(
            `[${new Date().toLocaleTimeString(undefined, { hour12: false })}]`,
          ),
        );
      }

      // fallback to return normal logger
      return umiLogger[prop];
    },
  },
);

export function isFilePath(path: string) {
  return isAbsolute(path) || path.startsWith('.');
}

export function getPkgNameFromPath(p: string) {
  return p.match(/^(?:@[a-z\d][\w-.]*\/|node:)?[a-z\d][\w-.]*/i)?.[0];
}

export const getDepPkgName = (name: string, packageJson: { name: string }) => {
  if (isFilePath(name)) {
    return packageJson.name;
  }
  return getPkgNameFromPath(name) ?? name;
};
