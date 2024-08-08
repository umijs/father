import { winPath } from '@umijs/utils';
import { lstatSync } from 'fs';
import path from 'path';
import { IFatherBundlessConfig, IFatherBundlessTypes } from '../../../../types';
import {
  addSourceMappingUrl,
  ensureRelativePath,
  getBundlessTargets,
  getSWCTransformReactOpts,
} from '../../../utils';
import { IJSTransformerFn } from '../types';

const isTs = (p: string): boolean => p.endsWith('.ts') || p.endsWith('.tsx');

const isDirectory = (path: string) => {
  try {
    return lstatSync(path).isDirectory();
  } catch {
    return false;
  }
};

/**
 * transform alias to relative path for swc paths
 * @param opts
 * @returns {Record<string, string[]>} alias
 */
const getSWCAlias = (opts: {
  fileAbsPath: string;
  alias: IFatherBundlessConfig['alias'];
  cwd: string;
}): Record<string, string[]> => {
  const { fileAbsPath, alias = {}, cwd } = opts;

  return Object.entries(alias).reduce<Record<string, string[]>>(
    (result, [name, target]) => {
      if (path.isAbsolute(target)) {
        const isDirAlias = isDirectory(target);

        let relativePath = winPath(
          isDirAlias
            ? path.relative(cwd, target)
            : path.relative(path.dirname(fileAbsPath), target),
        );
        relativePath = ensureRelativePath(relativePath);

        // suffix * for dir alias
        const aliasName = isDirAlias ? `${name}/*` : name;
        const aliasPath = isDirAlias ? `${relativePath}/*` : relativePath;

        // fit path omit index
        // eg: ./test/index.ts => ./test
        if (isDirAlias) {
          result[name] = [relativePath];
        }

        result[aliasName] = [aliasPath];
      } else {
        result[name] = [target];
      }

      return result;
    },
    {},
  );
};

const getModuleType = (type: IFatherBundlessTypes) => {
  if (type === IFatherBundlessTypes.CJS) {
    return 'commonjs';
  }

  return 'es6';
};

/**
 * replace absolute path with relative path
 */
export const replaceAbsPathWithRelativePath = (opts: {
  content: string;
  cwd: string;
  fileAbsPath: string;
}) => {
  const cwd = winPath(opts.cwd);
  const fileAbsPath = winPath(opts.fileAbsPath);
  const pathRegex = new RegExp('(\'|")((\\1|.)*?)\\1', 'g');
  const replacer = (oText: string, quote: string, target: string) => {
    if (!target.startsWith(cwd)) {
      return oText;
    }

    let relativePath = winPath(
      path.relative(path.dirname(fileAbsPath), target),
    );
    relativePath = ensureRelativePath(relativePath);

    return `${quote}${relativePath}${quote}`;
  };
  return opts.content.replace(pathRegex, replacer);
};

/**
 * swc transformer
 */
const swcTransformer: IJSTransformerFn = async function (content) {
  // swc will install on demand, so should import dynamic
  const { transform }: typeof import('@swc/core') = require('@swc/core');

  const { alias: oAlias = {} } = this.config;

  const isTSFile = isTs(this.paths.fileAbsPath);
  const isJSXFile = this.paths.fileAbsPath.endsWith('x');

  // transform alias to relative path for swc paths
  const alias = getSWCAlias({
    fileAbsPath: this.paths.fileAbsPath,
    alias: oAlias,
    cwd: this.paths.cwd,
  });

  let { code, map } = await transform(content, {
    cwd: this.paths.cwd,
    filename: this.paths.fileAbsPath,
    sourceFileName: this.config.sourcemap
      ? winPath(
          path.relative(
            path.dirname(this.paths.itemDistAbsPath),
            this.paths.fileAbsPath,
          ),
        )
      : undefined,
    sourceMaps: this.config.sourcemap,
    env: {
      targets: getBundlessTargets(this.config),
    },

    jsc: {
      baseUrl: this.paths.cwd,
      paths: alias,
      parser: {
        syntax: isTSFile ? 'typescript' : 'ecmascript',
        ...(isTSFile && isJSXFile ? { tsx: true } : {}),
        ...(!isTSFile && isJSXFile ? { jsx: true } : {}),
      },
      transform: {
        react: getSWCTransformReactOpts(
          this.pkg,
          path.dirname(this.paths.fileAbsPath),
        ),
      },
    },
    module: {
      type: getModuleType(this.config.format),
    },
  });

  // fix: https://github.com/swc-project/swc/issues/5165
  // remove this when swc fixes it.
  if (process.platform === 'win32') {
    code = replaceAbsPathWithRelativePath({
      content: code,
      cwd: this.paths.cwd,
      fileAbsPath: this.paths.fileAbsPath,
    });
  }

  if (map) {
    return [addSourceMappingUrl(code!, this.paths.itemDistAbsPath), map];
  }

  return [code!];
};

export default swcTransformer;
