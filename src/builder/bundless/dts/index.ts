import path from 'path';
import { chalk } from '@umijs/utils';
// @ts-ignore
import tsPathsTransformer from '../../../../compiled/@zerollup/ts-transform-paths';

export default async function getDeclarations(
  inputFiles: string[],
  opts: { cwd: string },
) {
  const output: { file: string; content: string; sourceFile: string }[] = [];
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  const ts: typeof import('typescript') = require('typescript');
  const tsconfigPath = ts.findConfigFile(opts.cwd, ts.sys.fileExists);

  if (tsconfigPath) {
    const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const tsconfig = ts.parseJsonConfigFileContent(
      tsconfigFile.config,
      ts.sys,
      path.dirname(tsconfigPath),
    );

    // check tsconfig error
    // istanbul-ignore-if
    if (tsconfig.errors.length) {
      throw new Error(
        `Error parsing tsconfig.json content: ${chalk.redBright(
          ts.flattenDiagnosticMessageText(tsconfig.errors[0].messageText, '\n'),
        )}`,
      );
    }

    const tsHost = ts.createCompilerHost(tsconfig.options);

    tsHost.writeFile = (fileName, declaration, _a, _b, sourceFiles) => {
      output.push({
        file: path.basename(fileName),
        content: declaration,
        sourceFile: sourceFiles![0].fileName,
      });
    };

    const program = ts.createProgram(
      inputFiles,
      tsconfig.options as any,
      tsHost,
    );

    // using ts-paths-transformer to transform tsconfig paths to relative path
    // reason: https://github.com/microsoft/TypeScript/issues/30952
    // ref: https://www.npmjs.com/package/@zerollup/ts-transform-paths
    const result = program.emit(undefined, undefined, undefined, true, {
      afterDeclarations: [tsPathsTransformer(program).afterDeclarations],
    });

    // check compile error
    // istanbul-ignore-if
    if (result.diagnostics.length) {
      throw new Error(
        `Error compiling declarations: ${chalk.redBright(
          ts.flattenDiagnosticMessageText(
            result.diagnostics[0].messageText,
            '\n',
          ),
        )}`,
      );
    }
  }

  return output;
}
