import { semver } from '@umijs/utils';
import type Less from 'less';
import path from 'path';
import type Sass from 'sass';
import {
  IApi,
  IFatherBaseConfig,
  IFatherCSSPreprocessorTypes,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../types';
import { getTsconfig } from './bundless/dts';
import type { IBundlessConfig } from './config';

export function addSourceMappingUrl(code: string, loc: string) {
  // support css preprocessors
  if (/\.(le|sa|sc)ss$/.test(loc)) {
    return (
      code +
      `/*# sourceMappingURL=${path.basename(
        loc.replace(/\.(le|sa|sc)ss$/, '.css.map'),
      )} */`
    );
  }

  return (
    code +
    '\n//# sourceMappingURL=' +
    path.basename(loc.replace(/\.(j|t)sx?$/, '.js.map'))
  );
}

export function getBaseTransformReactOpts(pkg: IApi['pkg'], cwd: string) {
  const reactVer = Object.assign(
    {},
    pkg.dependencies,
    pkg.peerDependencies,
  ).react;
  let opts: Record<string, any> = {};

  if (reactVer) {
    let isNewJSX: boolean;
    const tsconfig = getTsconfig(cwd);

    /* istanbul ignore else -- @preserve */
    if (tsconfig?.options?.jsx !== undefined) {
      // respect tsconfig first, `4` means `react-jsx`
      isNewJSX = tsconfig.options?.jsx === 4;
    } else {
      // fallback to match react versions which support new JSX transform
      // ref: https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html#how-to-upgrade-to-the-new-jsx-transform
      isNewJSX = semver.subset(
        reactVer,
        '>=17.0.0-0||^16.14.0||^15.7.0||^0.14.10',
      );
    }

    opts = {
      // force use production mode, to make sure dist of dev/build are consistent
      // ref: https://github.com/umijs/umi/blob/6f63435d42f8ef7110f73dcf33809e6cda750332/packages/babel-preset-umi/src/index.ts#L45
      development: false,
      // set jsx runtime automatically
      runtime: isNewJSX ? 'automatic' : 'classic',
      ...(isNewJSX ? {} : { importSource: undefined }),
    };
  }

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

const loadedPreprocessors: Partial<Record<IFatherCSSPreprocessorTypes, any>> =
  {};

export function loadPreprocessor(
  lang: IFatherCSSPreprocessorTypes.SASS,
  cwd: string,
): typeof Sass;
export function loadPreprocessor(
  lang: IFatherCSSPreprocessorTypes.LESS,
  cwd: string,
): typeof Less;
export function loadPreprocessor(
  lang: `${IFatherCSSPreprocessorTypes}`,
  cwd: string,
) {
  if (lang in loadedPreprocessors) {
    return loadedPreprocessors[lang];
  }

  try {
    const paths = require.resolve.paths?.(lang) || [];
    // Search in the root directory first, and fallback to the default require paths.
    paths.unshift(cwd);

    const resolved = require.resolve(lang, { paths });
    return (loadedPreprocessors[lang] = require(resolved));
  } catch (e: any) {
    if (e.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        `Preprocessor dependency "${lang}" not found. Did you install it?`,
      );
    } else {
      const message = new Error(
        `Preprocessor dependency "${lang}" failed to load:\n${e.message}`,
      );
      message.stack = e.stack + '\n' + message.stack;
      throw message;
    }
  }
}
