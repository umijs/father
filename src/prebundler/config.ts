import path from 'path';
import { winPath } from '@umijs/utils';
import {
  ExtractorConfig,
  IExtractorConfigPrepareOptions,
} from '@microsoft/api-extractor';
import { IApi, IFatherPreBundleConfig } from '../types';

interface IPreBundleConfig {
  deps: Record<string, { pkg: IApi['pkg']; output: string; nccConfig: any }>;
  dts: Record<
    string,
    {
      pkg: IApi['pkg'];
      output: string;
      maeConfig: ExtractorConfig;
      _maePrepareConfig: IExtractorConfigPrepareOptions;
    }
  >;
}

const DEFAULT_OUTPUT_DIR = './compiled';

/**
 * return type field value for pkg
 */
function getTypeFieldForPkg(pkg: IApi['pkg']): string | undefined {
  return pkg.type || pkg.types || pkg.typing || pkg.typings;
}

/**
 * get type info for pkg or @types/pkg
 */
function getTypeInfoForPkg(pkgPath: string) {
  const pkg = require(pkgPath);
  const info = { pkgPath: pkgPath, dtsPath: getTypeFieldForPkg(pkg)! };

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
        getTypeFieldForPkg(require(info.pkgPath))!,
      );
    } catch {
      return null;
    }
  }

  return info;
}

function getDtsConfig(opts: {
  cwd: string;
  pkgPath: string;
  dtsPath: string;
  outputPath: string;
}) {
  return {
    pkg: require(opts.pkgPath),
    output: opts.outputPath,
    // generate prepare config for @microsoft/api-extractor
    _maePrepareConfig: {
      configObject: {
        mainEntryPointFilePath: opts.dtsPath,
        projectFolder: path.dirname(opts.pkgPath),
        // enable dts rollup feature
        dtsRollup: {
          enabled: true,
          publicTrimmedFilePath: opts.outputPath,
        },
        // configure ts compiler
        compiler: {
          overrideTsconfig: {
            compilerOptions: {
              target: 'es5',
              module: 'commonjs',
              moduleResolution: 'node',
              strict: true,
              skipLibCheck: true,
            },
            include: [opts.cwd],
          },
        },
        // configure logger
        messages: {
          extractorMessageReporting: {
            // only log error by default
            default: { logLevel: 'error' },
            // omit release tag checking
            'ae-missing-release-tag': { logLevel: 'none' },
          },
        },
      },
      configObjectFullPath: undefined,
      packageJsonFullPath: opts.pkgPath,
    } as IExtractorConfigPrepareOptions,
    // after externals ready, generate final extractor config below
    maeConfig: undefined as any,
  };
}

export function getConfig(opts: {
  userConfig: IFatherPreBundleConfig;
  cwd: string;
  pkg: IApi['pkg'];
}) {
  // external project dependencies by default
  const pkgExternals: IFatherPreBundleConfig['extraExternals'] = Object.keys(
    Object.assign({}, opts.pkg.dependencies, opts.pkg.peerDependencies),
  ).reduce((r, dep) => ({ ...r, [dep]: dep }), {});
  const depExternals: IFatherPreBundleConfig['extraExternals'] = {};
  const config: IPreBundleConfig = { deps: {}, dts: {} };
  const { deps, extraExternals = {}, extraDtsDeps = [] } = opts.userConfig;

  // process deps config
  Object.entries(deps).forEach(([dep, depConfig]) => {
    // handle array deps
    const depName = Array.isArray(deps) ? deps[parseInt(dep)] : dep;
    depConfig = Array.isArray(deps) ? {} : depConfig;

    const depEntryPath = require.resolve(depName, { paths: [opts.cwd] });
    const depPkgPath = require.resolve(`${depName}/package.json`, {
      paths: [opts.cwd],
    });
    const depTypeInfo =
      depConfig.dts !== false ? getTypeInfoForPkg(depPkgPath) : null;
    const depPkg = require(depPkgPath);

    // generate bundle config
    config.deps[depEntryPath] = {
      nccConfig: {
        minify: depConfig.minify ?? true,
        target: 'es5',
        quiet: true,
        externals: {},
      },
      pkg: depPkg,
      output: path.resolve(
        opts.cwd,
        depConfig.output || `${DEFAULT_OUTPUT_DIR}/${depPkg.name}/index.js`,
      ),
    };

    // generate api-extractor config
    if (depTypeInfo) {
      const outputFilePath = config.deps[depEntryPath].output.replace(
        '.js',
        '.d.ts',
      );

      config.dts[depTypeInfo.dtsPath] = getDtsConfig({
        cwd: opts.cwd,
        pkgPath: depPkgPath,
        dtsPath: depTypeInfo.dtsPath,
        outputPath: outputFilePath,
      });
    }

    // prepare deps externals
    depExternals[depPkg.name] = config.deps[depEntryPath].output;
  });

  // process extraDtsDeps config
  extraDtsDeps.forEach((pkg) => {
    const depTypeInfo = getTypeInfoForPkg(
      require.resolve(`${pkg}/package.json`, { paths: [opts.cwd] }),
    );

    if (depTypeInfo) {
      config.dts[depTypeInfo.dtsPath] = getDtsConfig({
        cwd: opts.cwd,
        pkgPath: depTypeInfo.pkgPath,
        dtsPath: depTypeInfo.dtsPath,
        outputPath: path.resolve(
          opts.cwd,
          `${DEFAULT_OUTPUT_DIR}/${pkg}/index.d.ts`,
        ),
      });
    }
  });

  // process externals for deps
  Object.values(config.deps).forEach((depConfig) => {
    const rltDepExternals = Object.entries(depExternals).reduce<
      Record<string, string>
    >((r, [dep, target]) => {
      // skip self
      if (dep !== depConfig.pkg.name) {
        // transform dep externals path to relative path
        r[dep] = winPath(
          path.relative(path.dirname(depConfig.output), path.dirname(target)),
        );
      }

      return r;
    }, {});

    depConfig.nccConfig.externals = {
      ...pkgExternals,
      ...rltDepExternals,
      ...extraExternals,
    };
  });

  // process externals for dts
  Object.values(config.dts).forEach((dtsConfig) => {
    // always skip bundle external pkgs
    dtsConfig._maePrepareConfig.configObject.bundledPackages = Object.keys(
      dtsConfig.pkg.dependencies || {},
    ).filter((name) => {
      name = name.replace('@types/', '');

      return !depExternals[name] && !extraExternals[name];
    });

    // generate the final extract config
    dtsConfig.maeConfig = ExtractorConfig.prepare(dtsConfig._maePrepareConfig);
  });

  return config;
}
