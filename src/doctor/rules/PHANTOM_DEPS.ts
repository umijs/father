import { chalk } from '@umijs/utils';
import type { IDoctorReport } from '..';
import type { IApi } from '../../types';
import { getPkgNameFromPath } from '../../utils';

export default (api: IApi) => {
  api.addImportsCheckup(({ file, imports, mergedAlias, mergedExternals }) => {
    const errors: IDoctorReport = [];

    imports.forEach((i) => {
      const pkgName = getPkgNameFromPath(i.path);
      const aliasKeys = Object.keys(mergedAlias);

      if (
        pkgName &&
        api.pkg.name !== pkgName &&
        !api.pkg.dependencies?.[pkgName] &&
        !api.pkg.peerDependencies?.[pkgName] &&
        !api.pkg.optionalDependencies?.[pkgName] &&
        aliasKeys.every((k) => k !== i.path && !i.path.startsWith(`${k}/`)) &&
        !mergedExternals[i.path]
      ) {
        let resolvedPath: string;

        try {
          resolvedPath = require.resolve(pkgName, { paths: [api.cwd] });
        } catch {
          // take unresolved modules as third party modules
          // because require.resolve not support esm package
          resolvedPath = 'node_modules';
        }

        // for compatible with Node.js standard library, such as fs, path, etc.
        if (resolvedPath.includes('node_modules')) {
          errors.push({
            type: 'error',
            problem: `Source depends on \`${pkgName}\`, but there is no declaration of it
            ${chalk.gray(`at ${file}`)}`,
            solution:
              'Add it to one of `dependencies`, `peerDependencies` and `optionalDependencies` in the package.json file',
          });
        }
      }
    });

    return errors;
  });
};
