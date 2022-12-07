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

const defaultCompileTarget: Record<
  IFatherPlatformTypes,
  Record<IFatherJSTransformerTypes, any>
> = {
  [IFatherPlatformTypes.BROWSER]: {
    [IFatherJSTransformerTypes.BABEL]: { ie: 11 },
    [IFatherJSTransformerTypes.ESBUILD]: ['chrome65'],
    [IFatherJSTransformerTypes.SWC]: { chrome: 65 },
  },
  [IFatherPlatformTypes.NODE]: {
    [IFatherJSTransformerTypes.BABEL]: { node: 14 },
    [IFatherJSTransformerTypes.ESBUILD]: ['node14'],
    [IFatherJSTransformerTypes.SWC]: { node: 14 },
  },
};

export function getBundleTargets({ targets }: IFatherBaseConfig) {
  if (!targets || !Object.keys(targets).length) {
    return defaultCompileTarget[IFatherPlatformTypes.BROWSER][
      IFatherJSTransformerTypes.BABEL
    ];
  }

  return targets;
}

export function getBundlessTargets(config: IBundlessConfig) {
  const { platform, transformer, targets } = config;

  // targets is undefined or empty, fallback to default
  if (!targets || !Object.keys(targets).length) {
    return defaultCompileTarget[platform!][transformer!];
  }
  // esbuild accept string or string[]
  if (transformer === IFatherJSTransformerTypes.ESBUILD) {
    return Object.keys(targets).map((name) => `${name}${targets![name]}`);
  }

  return targets;
}
