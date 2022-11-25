import { semver } from '@umijs/utils';
import path from 'path';
import {
  IApi,
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

  // targets is undefined
  if (!targets) {
    return defaultBundlessTargets[platform][transformer];
  }

  if (transformer === 'swc') {
    if (typeof targets === 'string') return targets;
  }
  if (transformer === 'esbuild') {
    if (typeof targets === 'string' || Array.isArray(targets)) return targets;
  }
  if (typeof targets === 'object') return targets;

  // targets if invalid, fallback to default
  return defaultBundlessTargets[platform][transformer];
}
