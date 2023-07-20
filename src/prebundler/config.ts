import {
  ExtractorConfig,
  IExtractorConfigPrepareOptions,
} from '@microsoft/api-extractor';
import { winPath } from '@umijs/utils';
import path from 'path';
import { IApi, IFatherPreBundleConfig } from '../types';
import {
  getDepPkgName,
  getDepPkgPath,
  getDtsInfoForPkgPath,
  getNestedTypeDepsForPkg,
  isBuiltInModule,
} from '../utils';

export interface IPreBundleConfig {
  deps: Record<string, { pkg: IApi['pkg']; output: string; nccConfig: any }>;
  dts: Record<
    string,
    {
      pkg: IApi['pkg'];
      output: string;
      externals: Record<string, string>;
      maeConfig: ExtractorConfig;
      _maePrepareConfig: IExtractorConfigPrepareOptions;
    }
  >;
}

const DEFAULT_OUTPUT_DIR = './compiled';

/**
 * get dts rollup config
 */
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
            include: [opts.dtsPath],
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
    externals: undefined as any,
  };
}

/**
 * get relative externals for specific pre-bundle pkg from other pre-bundle deps
 * @note  for example, "compiled/a" can be externalized in "compiled/b" as "../a"
 */
function getRltExternalsFromDeps(
  depExternals: Record<string, string>,
  current: { name: string; output: string },
) {
  return Object.entries(depExternals).reduce<Record<string, string>>(
    (r, [dep, target]) => {
      // skip self
      if (dep !== current.name) {
        // transform dep externals path to relative path
        r[dep] = winPath(
          path.relative(path.dirname(current.output), path.dirname(target)),
        );
      }

      return r;
    },
    {},
  );
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
  const dtsDepExternals: IFatherPreBundleConfig['extraExternals'] = {};
  const config: IPreBundleConfig = { deps: {}, dts: {} };
  const {
    output,
    deps = [],
    extraExternals = {},
    extraDtsDeps = [],
  } = opts.userConfig;

  // process deps config
  Object.entries(deps).forEach(([dep, depConfig]) => {
    // handle array deps
    let depName = Array.isArray(deps) ? deps[parseInt(dep)] : dep;
    depConfig = Array.isArray(deps) ? {} : depConfig;

    const depPath = isBuiltInModule(depName) ? `${depName}/` : depName;
    const depEntryPath = require.resolve(depPath, { paths: [opts.cwd] });
    const depPkgPath = getDepPkgPath(depName, opts.cwd);
    const depTypeInfo =
      depConfig.dts !== false ? getDtsInfoForPkgPath(depPkgPath) : null;
    const depPkg = require(depPkgPath);
    depName = getDepPkgName(depName, depPkg);

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
        `${output || DEFAULT_OUTPUT_DIR}/${depName}/index.js`,
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
    depExternals[depName] = config.deps[depEntryPath].output;
  });

  // process extraDtsDeps config
  extraDtsDeps.forEach((pkg) => {
    const depTypeInfo = getDtsInfoForPkgPath(getDepPkgPath(pkg, opts.cwd));

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

      dtsDepExternals[pkg] = config.dts[depTypeInfo.dtsPath].output;
    }
  });

  // process externals for deps
  Object.values(config.deps).forEach((depConfig) => {
    const rltDepExternals = getRltExternalsFromDeps(depExternals, {
      name: depConfig.pkg.name!,
      output: depConfig.output,
    });

    depConfig.nccConfig.externals = {
      ...pkgExternals,
      ...rltDepExternals,
      ...extraExternals,
    };
  });

  // process externals for dts
  Object.values(config.dts).forEach((dtsConfig) => {
    const rltDepExternals = getRltExternalsFromDeps(
      {
        ...depExternals,
        ...dtsDepExternals,
      },
      {
        name: dtsConfig.pkg.name!,
        output: dtsConfig.output,
      },
    );

    // always skip bundle external pkgs
    const nestedDeps = getNestedTypeDepsForPkg(dtsConfig.pkg.name!, opts.cwd, {
      ...pkgExternals,
      ...depExternals,
      ...dtsDepExternals,
      ...extraExternals,
    });
    dtsConfig._maePrepareConfig.configObject.bundledPackages =
      Object.keys(nestedDeps);

    // prepare externals config
    dtsConfig.externals = {
      ...pkgExternals,
      ...rltDepExternals,
      ...extraExternals,
    };

    // generate the final extract config
    dtsConfig.maeConfig = ExtractorConfig.prepare(dtsConfig._maePrepareConfig);
  });

  return config;
}
