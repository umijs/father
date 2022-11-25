import { semver } from '@umijs/utils';
import path from 'path';
import {
  IApi,
  IFatherBaseConfig,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../types';
import type { IBundlessConfig } from './config';

export function addSourceMappingUrl(code: string, loc: string) {
  return (
    code +
    '\n//# sourceMappingURL=' +
    path.basename(loc.replace(/\.(jsx|tsx?)$/, '.js'))
  );
}

export function getIsLTRReact17(pkg: IApi['pkg']) {
  const reactVer = Object.assign(
    {},
    pkg.dependencies,
    pkg.peerDependencies,
  ).react;
  return semver.subset(reactVer, '>=17.0.0-0');
}

export function getBaseTransformReactOpts(pkg: IApi['pkg']) {
  const reactVer = Object.assign(
    {},
    pkg.dependencies,
    pkg.peerDependencies,
  ).react;
  let opts: Record<string, any> = {};

  if (reactVer) {
    const isLTRReact17 = getIsLTRReact17(pkg);

    opts = {
      // force use production mode, to make sure dist of dev/build are consistent
      // ref: https://github.com/umijs/umi/blob/6f63435d42f8ef7110f73dcf33809e6cda750332/packages/babel-preset-umi/src/index.ts#L45
      development: false,
      // use legacy jsx runtime for react@<17
      runtime: isLTRReact17 ? 'automatic' : 'classic',
      ...(isLTRReact17 ? {} : { importSource: undefined }),
    };
  }

  return opts;
}

export function getBabelPresetReactOpts(pkg: IApi['pkg']) {
  return {
    ...getBaseTransformReactOpts(pkg),
  };
}

export function getSWCTransformReactOpts(pkg: IApi['pkg']) {
  return {
    ...getBaseTransformReactOpts(pkg),
  };
}

export function ensureRelativePath(relativePath: string) {
  // prefix . for same-level path
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }
  return relativePath;
}

// transfer string to object, for babel preset targets
const normalizeBabelTargets = (targets?: IFatherBaseConfig['targets']) => {
  if (!targets) return undefined;

  const targetList = typeof targets === 'string' ? [targets] : targets;
  return targetList.reduce((prev, curr) => {
    const [, key, value] = /^([a-z_-]+)(\d+)$/i.exec(curr) || ([] as string[]);
    return { ...prev, [key]: +value || 0 };
  }, {} as Record<string, number>);
};

export function getBundleTargets(
  config: IFatherBaseConfig,
): Record<string, number> {
  return normalizeBabelTargets(config.targets) || { ie: 11 };
}

const defaultBundlessTargets: Record<
  IFatherPlatformTypes,
  Record<IFatherJSTransformerTypes, any>
> = {
  [IFatherPlatformTypes.BROWSER]: {
    babel: { ie: 11 },
    esbuild: 'es6',
    swc: 'es5',
  },
  [IFatherPlatformTypes.NODE]: {
    babel: { node: 14 },
    esbuild: 'node14',
    swc: 'es2019',
  },
};

export function getBundlessTargets(config: IBundlessConfig) {
  let {
    platform = IFatherPlatformTypes.BROWSER,
    transformer,
    targets,
  } = config;
  if (!transformer) {
    transformer =
      platform === IFatherPlatformTypes.BROWSER
        ? IFatherJSTransformerTypes.BABEL
        : IFatherJSTransformerTypes.ESBUILD;
  }

  // targets is undefined or empty
  if (!targets || !targets.length) {
    return defaultBundlessTargets[platform][transformer];
  }

  // swc accept only one target
  if (transformer === 'swc') {
    return typeof targets === 'string' ? targets : targets[0];
  }
  // esbuild accept string or string[]
  if (transformer === 'esbuild') {
    return targets;
  }
  // babel accept object
  return normalizeBabelTargets(targets);
}
