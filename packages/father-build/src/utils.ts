import minimatch from 'minimatch'
import { existsSync } from 'fs';
import { join } from 'path';
import { LessInBabelMode } from './types';

export function getExistFile({ cwd, files, returnRelative }) {
  for (const file of files) {
    const absFilePath = join(cwd, file);
    if (existsSync(absFilePath)) {
      return returnRelative ? file : absFilePath;
    }
  }
}

export function isValidPath (lessInBabelMode: LessInBabelMode, name: string) {
  if (typeof lessInBabelMode === 'boolean') return lessInBabelMode;
  if (typeof lessInBabelMode === 'object' && !lessInBabelMode.exclude) return true;
  if (typeof lessInBabelMode === 'object' && lessInBabelMode.exclude && lessInBabelMode.exclude.some((pattern) => minimatch(name, pattern, { matchBase: true }))) return false;
  return true;
}
