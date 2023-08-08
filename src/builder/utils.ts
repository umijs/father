import { semver } from '@umijs/utils';
import { createHash } from 'crypto';
import path from 'path';
import {
  IApi,
  IFatherBaseConfig,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../types';
import { getTsconfig } from './bundless/dts';
import type { IBundlessConfig } from './config';

export function addSourceMappingUrl(code: string, loc: string) {
  return (
    code +
    '\n//# sourceMappingURL=' +
    path.basename(loc.replace(/\.(jsx|tsx?)$/, '.js.map'))
  );
}

export function getBaseTransformReactOpts(pkg: IApi['pkg'], cwd: string) {
  let isNewJSX: boolean;
  let opts: Record<string, any> = {};
  const reactVer = Object.assign(
    {},
    pkg.dependencies,
    pkg.peerDependencies,
  ).react;
  const tsconfig = getTsconfig(cwd);

  /* istanbul ignore else -- @preserve */
  if (tsconfig?.options?.jsx !== undefined) {
    // respect tsconfig first, `4` means `react-jsx`
    isNewJSX = tsconfig.options?.jsx === 4;
  } else if (reactVer) {
    // fallback to match react versions which support new JSX transform
    // ref: https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#how-to-upgrade-to-the-new-jsx-transform
    isNewJSX = semver.subset(
      reactVer,
      '>=17.0.0-0||^16.14.0||^15.7.0||^0.14.10',
    );
  } else {
    return false;
  }

  opts = {
    // force use production mode, to make sure dist of dev/build are consistent
    // ref: https://github.com/umijs/umi/blob/6f63435d42f8ef7110f73dcf33809e6cda750332/packages/babel-preset-umi/src/index.ts#L45
    development: false,
    // set jsx runtime automatically
    runtime: isNewJSX ? 'automatic' : 'classic',
    ...(isNewJSX ? {} : { importSource: undefined }),
  };

  return opts;
}

export function getBabelPresetReactOpts(pkg: IApi['pkg'], cwd: string) {
  return {
    ...getBaseTransformReactOpts(pkg, cwd),
  };
}

export function getSWCTransformReactOpts(pkg: IApi['pkg'], cwd: string) {
  return {
    ...getBaseTransformReactOpts(pkg, cwd),
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
    [IFatherJSTransformerTypes.ESBUILD]: ['chrome51'],
    [IFatherJSTransformerTypes.SWC]: { ie: 11 },
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

export function getBabelStyledComponentsOpts(pkg: IApi['pkg']) {
  let opts: false | { fileName: boolean; namespace?: string } = false;

  // enable styled-components plugin for styled-components-based projects
  if (pkg.dependencies?.['styled-components']) {
    opts = { fileName: false };

    // set namespace for avoid className conflicts
    if (pkg.name) {
      const [name, org] = pkg.name.split('/').reverse();
      // hash org to make namespace clear
      const suffix = org
        ? `-${getContentHash(org, 4)}`
        : /* istanbul ignore next -- @preserve */
          '';

      opts.namespace = `${name}${suffix}`;
    }
  }

  return opts;
}

export function getContentHash(content: string, length = 8) {
  return createHash('md5').update(content).digest('hex').slice(0, length);
}
