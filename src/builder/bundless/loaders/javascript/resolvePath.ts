// @ts-ignore
import mapToRelative from 'babel-plugin-module-resolver/lib/mapToRelative';
// @ts-ignore
import normalizeOptions from 'babel-plugin-module-resolver/lib/normalizeOptions';
// @ts-ignore
import resolvePath from 'babel-plugin-module-resolver/lib/resolvePath';
// @ts-ignore
import * as utils from 'babel-plugin-module-resolver/lib/utils';
import path from 'path';

interface INormalizeOptions {
  cwd: string;
  extensions: Array<string>;
  alias: Array<[RegExp, Function]>;
}

function resolvePathFromAliasConfig(
  sourcePath: string,
  currentFile: string,
  opts: Record<string, object>,
) {
  if (utils.isRelativePath(sourcePath)) {
    return sourcePath;
  }

  const normalizedOpts: INormalizeOptions = normalizeOptions(currentFile, opts);

  const absoluteCurrentFile = path.resolve(currentFile);

  let aliasedSourceFile!: Array<string>;
  normalizedOpts.alias.find(([regExp, substitute]) => {
    const execResult = regExp.exec(sourcePath);

    if (execResult === null) {
      return false;
    }

    aliasedSourceFile = substitute(execResult);
    return true;
  });

  if (!aliasedSourceFile) {
    return resolvePath(sourcePath, absoluteCurrentFile, normalizedOpts);
  }

  if (Array.isArray(aliasedSourceFile)) {
    return aliasedSourceFile
      .map((asf) => {
        if (utils.isRelativePath(asf)) {
          return utils.toLocalPath(
            utils.toPosixPath(
              mapToRelative.default(
                normalizedOpts.cwd,
                absoluteCurrentFile,
                asf,
              ),
            ),
          );
        }

        return asf;
      })
      .find((src) =>
        utils.nodeResolvePath(
          src,
          path.dirname(absoluteCurrentFile),
          normalizedOpts.extensions,
        ),
      );
  }

  return utils.toLocalPath(
    utils.toPosixPath(
      mapToRelative(normalizedOpts.cwd, absoluteCurrentFile, aliasedSourceFile),
    ),
  );
}

export default resolvePathFromAliasConfig;
