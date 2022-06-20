/**
 * patcher for api-extractor, to support legacy export = syntax
 * @reason https://github.com/microsoft/rushstack/issues/2220
 * @solution hack tsHost.readFile for the CompilerState of api-extractor
 *           to replace legacy export = syntax to esm syntax
 */

import { Extractor, CompilerState } from '@microsoft/api-extractor';
import { chalk, logger } from '@umijs/utils';
import type { CompilerHost } from 'typescript';

// @ts-ignore
const oCreateCompilerHost = CompilerState._createCompilerHost;

if (!oCreateCompilerHost.name.includes('father')) {
  // @ts-ignore
  CompilerState._createCompilerHost = function _fatherHackCreateCompilerHost(
    ...args: any
  ) {
    const tsHost: CompilerHost = oCreateCompilerHost.apply(CompilerState, args);
    const oReadFile = tsHost.readFile;

    // hack readFile method to replace legacy export = syntax to esm
    tsHost.readFile = function fatherHackReadFile(...args) {
      let content = oReadFile.apply(tsHost, args);
      // regexp to match export = [Symbol];
      const legacyExportReg = /[\r\n]export\s+=\s+([\w$]+)\s*([;\r\n])/;
      const exportSymbol = content?.match(legacyExportReg)?.[1];

      if (exportSymbol) {
        // replace export = [Symbol] => export { [Symbol] as default } if matched
        content = content!.replace(
          legacyExportReg,
          '\nexport { $1 as default }$2',
        );

        // double-check export statement
        if (/[\r\n]export\s+=/.test(content)) {
          logger.warn(
            `Unhandled legacy export syntax in ${chalk.gray(
              args[0],
            )}, please report this issue to father if the d.ts file is unexpected.`,
          );
        }
      }

      return content;
    };

    return tsHost;
  };

  // disable typescript version checking logic to omit the log
  // because api-extractor builtin typescript is not latest
  // @ts-ignore
  Extractor._checkCompilerCompatibility = function fatherHackEmpty() {};
}
