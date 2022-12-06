import { semver } from '@umijs/utils';
import path from 'path';
import { IApi } from '../types';

export function addSourceMappingUrl(code: string, loc: string) {
  return (
    code +
    '\n//# sourceMappingURL=' +
    path.basename(loc.replace(/\.(jsx|tsx?)$/, '.js.map'))
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
