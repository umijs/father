import { chalk, logger, winPath } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
// @ts-ignore
import tsPathsTransformer from '../../../../compiled/@zerollup/ts-transform-paths';
import { getCache } from '../../../utils';

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
  const cache = getCache('bundless-dts');
  const output: { file: string; content: string; sourceFile: string }[] = [];
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  const ts: typeof import('typescript') = require('typescript');
  const tsconfig = getTsconfig(opts.cwd);

  if (tsconfig) {
    // check tsconfig error
    // istanbul-ignore-if
    if (tsconfig.errors.length) {
      throw new Error(
        `Error parsing tsconfig.json content: ${chalk.redBright(
          ts.flattenDiagnosticMessageText(tsconfig.errors[0].messageText, '\n'),
        )}`,
      );
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
    const cacheKeys = inputFiles.reduce<Record<string, string>>(
      (ret, file) => ({
        ...ret,
        // format: {path:mtime:config}
        [file]: [
          file,
          fs.lstatSync(file).mtimeMs,
          JSON.stringify(tsconfig.options),
        ].join(':'),
      }),
      {},
    );
    const cacheRets: Record<string, typeof output> = {};

    tsHost.writeFile = (fileName, declaration, _a, _b, sourceFiles) => {
      const sourceFile = sourceFiles![0].fileName;

      // only collect dts for input files, to avoid output error in watch mode
      // ref: https://github.com/umijs/father-next/issues/43
      if (inputFiles.includes(sourceFile)) {
        const ret = {
          file: path.basename(fileName),
          content: declaration,
          sourceFile,
        };

        output.push(ret);

        // group cache by file (d.ts & d.ts.map)
        cacheRets[cacheKeys[sourceFile]] ??= [];
        cacheRets[cacheKeys[sourceFile]].push(ret);
      }
    };

    // use cache first
    inputFiles = inputFiles.filter((file) => {
      const cacheRet = cache.getSync(cacheKeys[file], '');

      if (!cacheRet) return true;
      output.push(...cacheRet);
      return false;
    });

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

    // save cache
    Object.keys(cacheRets).forEach((key) => cache.setSync(key, cacheRets[key]));

    // process no d.ts inputs, fallback to empty array
    inputFiles.forEach((file) => {
      const cacheKey = cacheKeys[file];

      if (!cacheRets[cacheKey]) cache.setSync(cacheKey, []);
    });
  }

  return output;
}
