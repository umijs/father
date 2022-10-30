import { chalk } from '@umijs/utils';
import type { IDoctorReport } from '..';
import type { IApi } from '../../types';

export default (api: IApi) => {
  api.addImportsCheckup(({ file, imports, mergedAlias, mergedExternals }) => {
    const errors: IDoctorReport = [];

    imports.forEach((i) => {
      const pkgName = i.path.match(/^(?:@[\w-][\w-.]*\/)?[\w-][\w-.]*/i)?.[0];
      const aliasKeys = Object.keys(mergedAlias);

      if (
        pkgName &&
        api.pkg.name !== pkgName &&
        !api.pkg.dependencies?.[pkgName] &&
        !api.pkg.peerDependencies?.[pkgName] &&
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
            problem: `Source depend on \`${pkgName}\` but it is not in the \`dependencies\` or \`peerDependencies\`
            ${chalk.gray(`at ${file}`)}`,
            solution:
              'Add it to the `dependencies` or `peerDependencies` of the package.json file',
          });
        }
      }
    });

    return errors;
  });
};
