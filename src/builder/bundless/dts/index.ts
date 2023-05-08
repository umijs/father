import { chalk, winPath } from '@umijs/utils';
import path from 'path';
import tsPathsTransformer from 'typescript-transform-paths';
import { logger } from '../../../utils';

/**
 * get parsed tsconfig.json for specific path
 */
export function getTsconfig(cwd: string) {
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  const ts: typeof import('typescript') = require('typescript');
  const tsconfigPath = ts.findConfigFile(cwd, ts.sys.fileExists);

  if (tsconfigPath) {
    const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    return ts.parseJsonConfigFileContent(
      tsconfigFile.config,
      ts.sys,
      path.dirname(tsconfigPath),
    );
  }
}

/**
 * get declarations for specific files
 */
export default async function getDeclarations(
  inputFiles: string[],
  opts: { cwd: string },
) {
  const output: { file: string; content: string; sourceFile: string }[] = [];
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  const ts: typeof import('typescript') = require('typescript');
  const tsconfig = getTsconfig(opts.cwd);

  if (tsconfig) {
    // check tsconfig error
    /* istanbul ignore if -- @preserve */
    if (tsconfig.errors.length) {
      throw new Error(
        `Error parsing tsconfig.json content: ${chalk.redBright(
          ts.flattenDiagnosticMessageText(tsconfig.errors[0].messageText, '\n'),
        )}`,
      );
    }

    // warn if noEmit is false
    /* istanbul ignore if -- @preserve */
    if (tsconfig.options.declaration && tsconfig.options.noEmit === true) {
      logger.warn(
        'tsconfig.json `noEmit` is true, will not emit declaration files!',
      );

      return output;
    }

    // enable declarationMap by default in development mode
    if (
      process.env.NODE_ENV === 'development' &&
      tsconfig.options.declaration &&
      tsconfig.options.declarationMap !== false
    ) {
      tsconfig.options.declarationMap = true;
    }

    // remove paths which out of cwd, to avoid transform to relative path by ts-paths-transformer
    Object.keys(tsconfig.options.paths || {}).forEach((item) => {
      const pathAbsTarget = path.resolve(
        tsconfig.options.pathsBasePath as string,
        tsconfig.options.paths![item][0],
      );

      if (!winPath(pathAbsTarget).startsWith(`${winPath(opts.cwd)}/`)) {
        delete tsconfig.options.paths![item];
        logger.debug(
          `Remove ${item} from tsconfig.paths, because it's out of cwd.`,
        );
      }
    });

    const tsHost = ts.createCompilerHost(tsconfig.options);

    tsHost.writeFile = (fileName, content, _a, _b, sourceFiles) => {
      const sourceFile = sourceFiles?.[0].fileName;

      // only collect dts for input files, to avoid output error in watch mode
      // ref: https://github.com/umijs/father/issues/43
      if (sourceFile && inputFiles.includes(sourceFile)) {
        const ret = {
          file: path.basename(fileName),
          content,
          sourceFile,
        };

        output.push(ret);
      }
    };

    const program = ts.createProgram({
      rootNames: inputFiles,
      options: tsconfig.options as any,
      host: tsHost,
    });

    // using ts-paths-transformer to transform tsconfig paths to relative path
    // reason: https://github.com/microsoft/TypeScript/issues/30952
    // ref: https://www.npmjs.com/package/typescript-transform-paths
    const result = program.emit(undefined, undefined, undefined, true, {
      afterDeclarations: [
        tsPathsTransformer(
          program,
          { afterDeclarations: true },
          // specific typescript instance, because this plugin is incompatible with typescript@4.9.x currently
          // but some project may declare typescript and some dependency manager will hoist project's typescript
          // rather than father's typescript for this plugin
          { ts },
        ),
      ],
    });

    // check compile error
    // istanbul-ignore-if
    if (result.diagnostics.length) {
      result.diagnostics.forEach((d) => {
        const loc = ts.getLineAndCharacterOfPosition(d.file!, d.start!);
        const rltPath = winPath(path.relative(opts.cwd, d.file!.fileName));
        const errMsg = ts.flattenDiagnosticMessageText(d.messageText, '\n');

        logger.error(
          `${chalk.blueBright(rltPath)}:${
            // correct line number & column number, ref: https://github.com/microsoft/TypeScript/blob/93f2d2b9a1b2f8861b49d76bb5e58f6e9f2b56ee/src/compiler/tracing.ts#L185
            `${chalk.yellow(loc.line + 1)}:${chalk.yellow(loc.character + 1)}`
          } - ${chalk.gray(`TS${d.code}:`)} ${errMsg}`,
        );
      });
      throw new Error('Declaration generation failed.');
    }
  }

  return output;
}
