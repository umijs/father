import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Service } from '@umijs/core';
import {
  glob,
  lodash,
  getFile,
  compatESModuleRequire,
  winPath,
} from '@umijs/utils';

export function isLerna({ cwd }: { cwd: string }) {
  return existsSync(join(cwd, 'lerna.json'));
}

export function getPackages({
  cwd,
  pkg,
}: {
  cwd: string;
  pkg: typeof Service.prototype.pkg;
}) {
  const { useWorkspaces } = require(join(cwd, 'lerna.json')) as {
    useWorkspaces: boolean;
  };
  const patterns: string[] = useWorkspaces ? pkg.workspaces : ['packages/*'];
  return patterns.reduce((memo, pattern) => {
    return lodash.uniq(
      memo.concat(
        glob.sync(pattern, {
          cwd,
        }),
      ),
    );
  }, [] as string[]);
}

export function getPackageConfig(opts: { pkgRoot: string }) {
  const file = getFile({
    base: opts.pkgRoot,
    fileNameWithoutExt: '.fatherrc',
    type: 'javascript',
  });
  if (file) {
    return compatESModuleRequire(require(join(opts.pkgRoot, file.filename)));
  } else {
    return {};
  }
}

export function getTSConfig(opts: { cwd: string }) {
  const tsConfigFile = join(opts.cwd, 'tsconfig.json');
  if (existsSync(tsConfigFile)) {
    return JSON.parse(readFileSync(tsConfigFile, 'utf-8'));
  } else {
    return {};
  }
}

export function getRelativePath(path: string, cwd: string) {
  return winPath(path).replace(`${winPath(cwd)}/`, '');
}
