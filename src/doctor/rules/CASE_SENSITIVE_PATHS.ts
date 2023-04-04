import type { IDoctorReport } from '..';
import type { IApi } from '../../types';
import fs from 'fs';
import enhancedResolve from 'enhanced-resolve';
import CaseSensitivePathsPlugin from '@umijs/case-sensitive-paths-webpack-plugin';
import { chalk } from '@umijs/utils';

export default (api: IApi) => {
  const checker = new CaseSensitivePathsPlugin();
  let resolver: ReturnType<typeof enhancedResolve['create']['sync']>;
  let aliasKeys: string[];

  // init checker
  checker.fs = fs;
  checker.context = api.cwd;

  api.addImportsCheckup(async ({ file, imports, mergedAlias }) => {
    const errors: IDoctorReport = [];

    resolver ??= enhancedResolve.create.sync({
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.json'],
      alias: mergedAlias,
    });
    aliasKeys ??= Object.keys(mergedAlias);

    for (const i of imports) {
      if (
        i.path.startsWith('.') ||
        aliasKeys.some((k) => k === i.path || i.path.startsWith(`${k}/`))
      ) {
        let res: ReturnType<typeof resolver> = false;

        // try to resolve import to absolute file path
        try {
          res = resolver(i.resolveDir, i.path);
        } catch {
          /* skip if module not found */
        }

        // check case sensitive
        if (res && checker.isCheckable(res)) {
          try {
            await checker.checkFileExistsWithCase(res);
          } catch (e: any) {
            errors.push({
              type: 'error',
              problem: `${e.message
                .replace(/\[.+?\] /, '')
                .replace(/`.+?`/, `\`${i.path}\``)}
            ${chalk.gray(`at ${file}`)}`,
              solution:
                'Make sure that import path and filesystem path are exactly the same',
            });
          }
        }
      }
    }

    return errors;
  });
};
