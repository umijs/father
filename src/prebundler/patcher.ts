/**
 * patcher for api-extractor, to support legacy export = syntax
 * @reason https://github.com/microsoft/rushstack/issues/2220
 * @solution hijack tsHost.readFile for the CompilerState of api-extractor
 *           to replace legacy export = [Specifier] to export { [Specifier] as default }
 *           and re-export all types within exported namespace
 */

import { CompilerState, Extractor } from '@microsoft/api-extractor';
import type { Collector } from '@microsoft/api-extractor/lib/collector/Collector';
import {
  DtsRollupGenerator,
  DtsRollupKind,
} from '@microsoft/api-extractor/lib/generators/DtsRollupGenerator';
import { IndentedWriter } from '@microsoft/api-extractor/lib/generators/IndentedWriter';
import type { CompilerHost, ExportAssignment, Identifier } from 'typescript';
import { setSharedData } from './shared';

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
      let content = oReadFile.apply(tsHost, args)!;
      const mayBeLegacyExport = /[\r\n]\s*export\s+=\s+[\w$]+/.test(content);

      // simple filter with regexp, for performance
      if (mayBeLegacyExport) {
        const ts: typeof import('typescript') = require('typescript');
        const sourceFile = ts.createSourceFile(
          args[0],
          content,
          ts.ScriptTarget.ESNext,
        );
        const { statements } = sourceFile;
        const exportEquals = statements.find(
          (stmt) => ts.isExportAssignment(stmt) && stmt.isExportEquals,
        ) as ExportAssignment;

        // strict filter with AST, for precision
        if (exportEquals) {
          const declarationIds: string[] = [];
          const exportSpecifier = (exportEquals.expression as Identifier)
            .escapedText;

          statements.forEach((stmt) => {
            // try to find exported namespace
            if (
              ts.isModuleDeclaration(stmt) &&
              ts.isIdentifier(stmt.name) &&
              stmt.name.escapedText === exportSpecifier &&
              stmt.body &&
              // to avoid esbuild-jest to fail
              // ref: https://github.com/aelbore/esbuild-jest/blob/master/src/index.ts#L33
              // issue: https://github.com/aelbore/esbuild-jest/issues/57#issuecomment-934679846
              // prettier-ignore
              (ts.isModuleBlock)(stmt.body)
            ) {
              stmt.body.statements.forEach((s) => {
                // collect all valid declarations with exported namespace
                if (
                  ts.isTypeAliasDeclaration(s) ||
                  ts.isInterfaceDeclaration(s) ||
                  ts.isEnumDeclaration(s) ||
                  ts.isFunctionDeclaration(s) ||
                  ts.isClassDeclaration(s)
                ) {
                  declarationIds.push(s.name!.escapedText!);
                }
              });
            }
          });

          // replace export = to export { [Specifier] as default }
          content = `${content.substring(
            0,
            exportEquals.pos,
          )}\nexport { ${exportSpecifier} as default };${content.substring(
            exportEquals.end,
          )}`;

          // re-export each types for namespace
          declarationIds.forEach((id) => {
            content += `\nexport type ${id} = ${exportSpecifier}.${id};`;
          });
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

  // hijack write file logic
  DtsRollupGenerator.writeTypingsFile = function fatherHackWriteTypingsFile(
    collector: Collector,
    dtsFilename: string,
    dtsKind: DtsRollupKind,
  ) {
    const writer: IndentedWriter = new IndentedWriter();
    writer.trimLeadingSpaces = true;

    // @ts-ignore
    DtsRollupGenerator._generateTypingsFileContent(collector, writer, dtsKind);

    setSharedData(dtsFilename, writer.toString());
  };
}
