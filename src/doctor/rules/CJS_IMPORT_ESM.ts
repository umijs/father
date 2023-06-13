import { chalk, winPath } from '@umijs/utils';
import enhancedResolve from 'enhanced-resolve';
import vm from 'vm';
import type { IDoctorReport } from '..';
import type { IApi } from '../../types';
import { getPkgNameFromPath } from '../../utils';

export default (api: IApi) => {
  const sandbox = vm.createContext({ require });
  let resolver: ReturnType<(typeof enhancedResolve)['create']['sync']>;

  api.describe({
    // disable temporarily
    // ref: https://github.com/umijs/father/issues/624
    enableBy: () => false,
  });

  api.addImportsCheckup(
    ({ file, imports, configProviders, mergedExternals, mergedAlias }) => {
      const errors: IDoctorReport = [];

      // apply this rule only when cjs available
      if (api.config.cjs) {
        // skip if file is ignored by cjs bundless
        if (configProviders.bundless.cjs!.getConfigForFile(file)) {
          imports.forEach((i) => {
            const pkgName = getPkgNameFromPath(i.path);

            // ignore relative import and externalized dep
            if (
              pkgName &&
              !mergedExternals[i.path] &&
              i.kind === 'import-statement'
            ) {
              resolver ??= enhancedResolve.create.sync({
                alias: mergedAlias,
              });

              try {
                const res = resolver(i.resolveDir, i.path);

                // only check npm package
                // why check node_modules?
                // because some alias may point to src but also like package name
                if (res && res.includes('node_modules')) {
                  vm.runInContext(`require('${winPath(res)}')`, sandbox);
                }
              } catch (e: any) {
                if (e.code === 'ERR_REQUIRE_ESM') {
                  errors.push({
                    type: 'error',
                    problem: `CommonJS dist file import an ES Module \`${
                      i.path
                    }\`, it will cause \`ERR_REQUIRE_ESM\` error in Node.js runtime
                  ${chalk.gray(`at ${file}`)}`,
                    solution:
                      'Convert `import` to `await import`, or find a CommonJS version of the package',
                  });
                }
              }
            }
          });
        }
      }

      return errors;
    },
  );
};
