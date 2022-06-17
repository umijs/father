import path from 'path';
import { winPath } from '@umijs/utils';
import { IApi, IFatherPreBundleConfig } from '../types';

const DEFAULT_OUTPUT_DIR = './compiled';

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
  const config: { deps: Record<string, any> } = { deps: {} };
  const { extraExternals = {} } = opts.userConfig;
  let { deps = {} } = opts.userConfig;

  // process deps config
  Object.entries(deps).forEach(([dep, depConfig]) => {
    // handle array deps
    const depName = Array.isArray(deps) ? deps[parseInt(dep)] : dep;
    depConfig = Array.isArray(deps) ? {} : depConfig;

    const depEntryPath = require.resolve(depName, { paths: [opts.cwd] });

    // generate build config
    config.deps[depEntryPath] = {
      ncc: {
        minify: depConfig.minify || true,
        target: 'es5',
        quiet: true,
        externals: {},
      },
      pkg: require(require.resolve(`${depName}/package.json`, {
        paths: [opts.cwd],
      })),
      output: path.resolve(
        opts.cwd,
        depConfig.output || `${DEFAULT_OUTPUT_DIR}/${depName}/index.js`,
      ),
    };

    // prepare deps externals
    depExternals[depName] = config.deps[depEntryPath].output;
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

    depConfig.ncc.externals = {
      ...pkgExternals,
      ...rltDepExternals,
      ...extraExternals,
    };
  });

  return config;
}
