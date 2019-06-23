import { existsSync } from 'fs';
import slash from 'slash2';
import { join } from 'path';

export function getExistFile({ cwd, files, returnRelative }) {
  for (const file of files) {
    const absFilePath = join(cwd, file);
    if (existsSync(absFilePath)) {
      return returnRelative ? file : absFilePath;
    }
  }
}

export function winPath(path) {
  return slash(path);
}
