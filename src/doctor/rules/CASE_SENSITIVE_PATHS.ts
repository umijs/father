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

  // set fs for checker
  checker.fs = fs;

  api.addImportsCheckup(async ({ file, imports, mergedAlias }) => {
    const errors: IDoctorReport = [];

    resolver ??= enhancedResolve.create.sync({
      // handle source extensions
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.json', '.node'],
      mainFields: ['module', 'main', 'browser'],
      // keep path clear in cnpm/pnpm project
      symlinks: false,
      alias: mergedAlias,
    });
    aliasKeys ??= Object.keys(mergedAlias);

    for (const i of imports) {
      let res: ReturnType<typeof resolver> = false;

      // try to resolve import to absolute file path
      try {
        res = resolver(i.resolveDir, i.path);
      } catch {
        /* skip if module not found */
      }

      // check case sensitive
      if (res) {
        // why ignore next?
        // because coverage will run on linux, and linux is case-sensitive
        /* istanbul ignore next -- @preserve */
        try {
          checker.context =
            // for npm package, use package root path as context, to avoid check node_modules/*
            res.match(/^.+node_modules[\/](?:@[^\/]+[\/])?[^\/]+/)?.[0] ||
            // for local file, use cwd as context
            api.cwd;
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

    return errors;
  });
};
