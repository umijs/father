import { chalk, fsExtra, winPath } from '@umijs/utils';
import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import tsPathsTransformer from 'typescript-transform-paths';
import { promisify } from 'util';
import { IFatherDtsCompilerTypes } from '../../../types';
import { getCache, getCachePath, logger } from '../../../utils';
import { getContentHash } from '../../utils';

const execFileAsync = promisify(execFile);

type ParsedTsconfig = ReturnType<typeof getTsconfig>;
type DeclarationOutput = {
  file: string;
  content: string;
  sourceFile: string;
};

/**
 * get tsconfig.json path for specific path
 */
export function getTsconfigPath(cwd: string) {
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  const ts: typeof import('typescript') = require('typescript');

  return ts.findConfigFile(
    cwd,
    ts.sys.fileExists,
    process.env.FATHER_TSCONFIG_NAME,
  );
}

/**
 * get parsed tsconfig.json for specific path
 * ref: https://github.com/privatenumber/get-tsconfig#how-can-i-use-typescript-to-parse-tsconfigjson
 */
export function getTsconfig(cwd: string) {
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  const ts: typeof import('typescript') = require('typescript');
  const tsconfigPath = getTsconfigPath(cwd);

  if (tsconfigPath) {
    const tsconfigFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    return ts.parseJsonConfigFileContent(
      tsconfigFile.config,
      ts.sys,
      path.dirname(tsconfigPath),
      undefined,
      // specify config file path like tsc, to ensure type roots behavior same as tsc
      // ref: https://github.com/microsoft/TypeScript/blob/0464e91c8b67579a4ed840e5783575a493c958e0/src/compiler/program.ts#L2325
      tsconfigPath,
    );
  }
}

function getTransformPaths(tsconfig: NonNullable<ParsedTsconfig>, cwd: string) {
  const transformPaths: Record<string, string[]> = {};

  // remove paths which out of cwd, to avoid transform to relative path by ts-paths-transformer
  Object.keys(tsconfig.options.paths || {}).forEach((item) => {
    const pathAbsTarget = path.resolve(
      tsconfig.options.pathsBasePath as string,
      tsconfig.options.paths![item][0],
    );

    if (winPath(pathAbsTarget).startsWith(`${winPath(cwd)}/`)) {
      transformPaths[item] = tsconfig.options.paths![item];
    } else {
      logger.debug(
        `Skip transform ${item} from tsconfig.paths, because it's out of cwd.`,
      );
    }
  });

  return transformPaths;
}

export function resolveTsgoBin(cwd: string) {
  let pkgPath: string;

  try {
    pkgPath = require.resolve('@typescript/native-preview/package.json', {
      paths: [cwd],
    });
  } catch {
    throw new Error(
      'dts.compiler: "tsgo" requires @typescript/native-preview to be installed. Please add it to devDependencies first.',
    );
  }

  const pkgDir = path.dirname(pkgPath);
  const pkg = fsExtra.readJSONSync(pkgPath);
  const declaredBin =
    typeof pkg.bin === 'string'
      ? pkg.bin
      : typeof pkg.bin?.tsgo === 'string'
      ? pkg.bin.tsgo
      : undefined;
  const candidates = [
    declaredBin,
    // @typescript/native-preview <= 7.0.0-dev.20260624.1
    'bin/tsgo.js',
    // @typescript/native-preview >= 7.0.0-dev.20260629.1
    'bin/tsgo',
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const binPath = path.resolve(pkgDir, candidate);
    if (fs.existsSync(binPath)) {
      return binPath;
    }
  }

  throw new Error(
    `Cannot find tsgo binary from @typescript/native-preview at ${pkgDir}. Tried: ${candidates
      .map((candidate) => path.resolve(pkgDir, candidate))
      .join(', ')}.`,
  );
}

function isDtsOutput(filePath: string) {
  return /\.d\.(?:[cm]ts|ts)(?:\.map)?$/.test(filePath);
}

function normalizeDtsSpecifier(filePath: string) {
  const normalized = winPath(filePath).replace(/\.d\.(?:[cm]ts|ts)$/, '');
  const withoutIndex = normalized.replace(/\/index$/, '');
  return withoutIndex.startsWith('.') ? withoutIndex : `./${withoutIndex}`;
}

function getPathAliasTarget(
  specifier: string,
  tsconfig: NonNullable<ParsedTsconfig>,
  transformPaths: Record<string, string[]>,
) {
  for (const [pattern, targets] of Object.entries(transformPaths)) {
    const wildcardIndex = pattern.indexOf('*');
    let matched: string | undefined;

    if (wildcardIndex > -1) {
      const prefix = pattern.slice(0, wildcardIndex);
      const suffix = pattern.slice(wildcardIndex + 1);
      if (specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
        matched = specifier.slice(
          prefix.length,
          specifier.length - suffix.length,
        );
      }
    } else if (specifier === pattern) {
      matched = '';
    }

    if (typeof matched !== 'undefined' && targets[0]) {
      const target = targets[0].replace('*', matched);
      return path.resolve(tsconfig.options.pathsBasePath as string, target);
    }
  }
}

function findSourceFileByAliasTarget(
  aliasTarget: string,
  tsconfig: NonNullable<ParsedTsconfig>,
) {
  const candidates = [
    aliasTarget,
    `${aliasTarget}.ts`,
    `${aliasTarget}.tsx`,
    `${aliasTarget}.mts`,
    `${aliasTarget}.cts`,
    path.join(aliasTarget, 'index.ts'),
    path.join(aliasTarget, 'index.tsx'),
    path.join(aliasTarget, 'index.mts'),
    path.join(aliasTarget, 'index.cts'),
  ].map(winPath);

  return tsconfig.fileNames.find((file) => candidates.includes(winPath(file)));
}

function rewriteDtsPaths(
  content: string,
  currentDtsFile: string,
  tsconfig: NonNullable<ParsedTsconfig>,
  transformPaths: Record<string, string[]>,
  sourceDtsFileMap: Map<string, string>,
) {
  return content.replace(
    /(from\s+|import\s*(?:\(\s*)?|module\s+)(['"])([^'"]+)\2/g,
    (raw, prefix: string, quote: string, specifier: string) => {
      const aliasTarget = getPathAliasTarget(
        specifier,
        tsconfig,
        transformPaths,
      );
      const targetSourceFile =
        aliasTarget && findSourceFileByAliasTarget(aliasTarget, tsconfig);
      const targetDtsFile =
        targetSourceFile && sourceDtsFileMap.get(winPath(targetSourceFile));

      if (!targetDtsFile) {
        return raw;
      }

      const relativePath = path.relative(
        path.dirname(currentDtsFile),
        targetDtsFile,
      );
      return `${prefix}${quote}${normalizeDtsSpecifier(relativePath)}${quote}`;
    },
  );
}

function normalizeDtsMap(
  content: string,
  sourceFile: string,
  finalMapFile: string,
) {
  try {
    const map = JSON.parse(content);
    map.file = path.basename(finalMapFile).replace(/\.map$/, '');
    map.sources = [
      winPath(path.relative(path.dirname(finalMapFile), sourceFile)),
    ];
    return JSON.stringify(map);
  } catch {
    return content;
  }
}

function toRelativeConfigPath(fromDir: string, target: string) {
  const relativePath = winPath(path.relative(fromDir, target));

  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function getTsgoRootDir(
  ts: typeof import('typescript'),
  tsconfig: NonNullable<ParsedTsconfig>,
  inputFiles: string[],
  cwd: string,
) {
  return (
    tsconfig.options.rootDir ||
    (ts as any).getCommonSourceDirectory(
      tsconfig.options,
      () => inputFiles,
      cwd,
      (fileName: string) => fileName,
    )
  );
}

function writeTsgoConfig(
  ts: typeof import('typescript'),
  tsconfig: NonNullable<ParsedTsconfig>,
  tsconfigPath: string,
  inputFiles: string[],
  cwd: string,
  declarationDir: string,
) {
  const tsgoConfig = (ts as any).convertToTSConfig(
    tsconfig,
    tsconfigPath,
    ts.sys,
  );
  const compilerOptions = {
    ...tsgoConfig.compilerOptions,
    declaration: true,
    declarationDir,
    emitDeclarationOnly: true,
    noEmit: false,
    rootDir: toRelativeConfigPath(
      declarationDir,
      getTsgoRootDir(ts, tsconfig, inputFiles, cwd),
    ),
  };
  const baseUrl = compilerOptions.baseUrl;

  if (compilerOptions.paths) {
    const baseUrlAbs = path.resolve(cwd, baseUrl || '.');

    compilerOptions.paths = Object.entries(compilerOptions.paths).reduce(
      (ret, [key, values]) => ({
        ...ret,
        [key]: (values as string[]).map((value) =>
          toRelativeConfigPath(declarationDir, path.resolve(baseUrlAbs, value)),
        ),
      }),
      {},
    );
  }

  delete compilerOptions.baseUrl;

  const tempConfigPath = path.join(declarationDir, 'tsconfig.json');
  fs.writeFileSync(
    tempConfigPath,
    JSON.stringify(
      {
        compilerOptions,
        files: tsconfig.fileNames.map((file) =>
          toRelativeConfigPath(declarationDir, file),
        ),
      },
      null,
      2,
    ),
  );

  return tempConfigPath;
}

async function getDeclarationsByTsgo(
  inputFiles: string[],
  opts: {
    cwd: string;
    outputDirs?: Map<string, string>;
  },
  ts: typeof import('typescript'),
  tsconfig: NonNullable<ParsedTsconfig>,
  transformPaths: Record<string, string[]>,
) {
  const tsconfigPath = getTsconfigPath(opts.cwd);
  const tsgoBin = resolveTsgoBin(opts.cwd);
  const tempParent = path.join(opts.cwd, getCachePath());
  fsExtra.ensureDirSync(tempParent);
  const declarationDir = fs.mkdtempSync(path.join(tempParent, 'tsgo-dts-'));
  const tsgoConfigPath = writeTsgoConfig(
    ts,
    tsconfig,
    tsconfigPath!,
    inputFiles,
    opts.cwd,
    declarationDir,
  );
  const output: DeclarationOutput[] = [];
  const rootDir = getTsgoRootDir(ts, tsconfig, inputFiles, opts.cwd);

  const tsgoTsconfig = {
    ...tsconfig,
    options: {
      ...tsconfig.options,
      declaration: true,
      declarationDir,
      emitDeclarationOnly: true,
      noEmit: false,
      rootDir,
    },
  };
  const sourceDtsFileMap = new Map<string, string>();

  inputFiles.forEach((file) => {
    const dtsFile = ts
      .getOutputFileNames(tsgoTsconfig, file, false)
      .find((item) => /\.d\.(?:[cm]ts|ts)$/.test(item));
    const outputDir = opts.outputDirs?.get(winPath(file));

    if (dtsFile && outputDir) {
      sourceDtsFileMap.set(
        winPath(file),
        path.join(outputDir, path.basename(dtsFile)),
      );
    }
  });

  try {
    await execFileAsync(
      process.execPath,
      [
        tsgoBin,
        '--project',
        tsgoConfigPath,
        '--declarationDir',
        declarationDir,
        '--noEmit',
        'false',
        '--declaration',
        '--emitDeclarationOnly',
      ],
      {
        cwd: opts.cwd,
        maxBuffer: 1024 * 1024 * 64,
      },
    );

    inputFiles.forEach((sourceFile) => {
      ts.getOutputFileNames(tsgoTsconfig, sourceFile, false)
        .filter(isDtsOutput)
        .forEach((fileName) => {
          if (!fs.existsSync(fileName)) return;

          const outputDir = opts.outputDirs?.get(winPath(sourceFile));
          const finalFile = outputDir
            ? path.join(outputDir, path.basename(fileName))
            : fileName;
          const isMap = fileName.endsWith('.map');
          let content = fs.readFileSync(fileName, 'utf-8');

          if (isMap) {
            content = normalizeDtsMap(content, sourceFile, finalFile);
          } else {
            content = rewriteDtsPaths(
              content,
              finalFile,
              tsconfig,
              transformPaths,
              sourceDtsFileMap,
            );
          }

          output.push({
            file: path.basename(fileName),
            content,
            sourceFile,
          });
        });
    });
  } catch (err: any) {
    [err.stdout, err.stderr].forEach((output) => {
      output
        ?.toString()
        .split('\n')
        .filter(Boolean)
        .forEach((line: string) => logger.error(chalk.gray('[tsgo]'), line));
    });

    throw new Error('Declaration generation failed.');
  } finally {
    fsExtra.removeSync(declarationDir);
  }

  return output;
}

/**
 * get declarations for specific files
 */
export default async function getDeclarations(
  inputFiles: string[],
  opts: {
    cwd: string;
    compiler?: `${IFatherDtsCompilerTypes}`;
    outputDirs?: Map<string, string>;
  },
) {
  const cache = getCache('bundless-dts');
  const enableCache = process.env.FATHER_CACHE !== 'none';
  const tscCacheDir = path.join(opts.cwd, getCachePath(), 'tsc');
  if (enableCache) {
    // make tsc cache dir
    fsExtra.ensureDirSync(tscCacheDir);
  }

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

    const transformPaths = getTransformPaths(tsconfig, opts.cwd);

    if (opts.compiler === IFatherDtsCompilerTypes.TSGO) {
      return getDeclarationsByTsgo(
        inputFiles,
        opts,
        ts,
        tsconfig,
        transformPaths,
      );
    }

    // enable incremental for cache
    if (enableCache && typeof tsconfig.options.incremental === 'undefined') {
      tsconfig.options.incremental = true;
      tsconfig.options.tsBuildInfoFile = path.join(
        tscCacheDir,
        'dts.tsbuildinfo',
      );
    }

    const tsHost = ts.createIncrementalCompilerHost(tsconfig.options);
    const cacheKeys = inputFiles.reduce<Record<string, string>>(
      (ret, file) => ({
        ...ret,
        // format: {path:contenthash}
        [file]: [file, getContentHash(fs.readFileSync(file, 'utf-8'))].join(
          ':',
        ),
      }),
      {},
    );
    const cacheRets: Record<string, typeof output> = {};

    tsHost.writeFile = (fileName, content, _a, _b, sourceFiles) => {
      const sourceFile = sourceFiles?.[0].fileName;

      if (fileName === tsconfig.options.tsBuildInfoFile) {
        // save incremental cache
        fsExtra.writeFileSync(tsconfig.options.tsBuildInfoFile, content);
      } else if (sourceFile) {
        // write d.ts & d.ts.map and save cache
        const ret = {
          file: path.basename(fileName),
          content,
          sourceFile,
        };

        // only collect dts for input files, to avoid output error in watch mode
        // ref: https://github.com/umijs/father-next/issues/43
        if (inputFiles.includes(sourceFile)) {
          const index = output.findIndex(
            (out) => out.file === ret.file && out.sourceFile === ret.sourceFile,
          );
          if (index > -1) {
            output.splice(index, 1, ret);
          } else {
            output.push(ret);
          }
        }

        // group cache by file (d.ts & d.ts.map)
        // always save cache even if it's not input file, to avoid cache miss
        // because it probably can be used in next bundless run
        const cacheKey =
          cacheKeys[sourceFile] ||
          [
            sourceFile,
            getContentHash(fs.readFileSync(sourceFile, 'utf-8')),
          ].join(':');

        cacheRets[cacheKey] ??= [];
        cacheRets[cacheKey].push(ret);
      }
    };

    // use cache first
    inputFiles.forEach((file) => {
      const cacheRet = cache.getSync(cacheKeys[file], '');
      if (cacheRet) {
        output.push(...cacheRet);
      }
    });

    const incrProgram = ts.createIncrementalProgram({
      rootNames: tsconfig.fileNames,
      options: tsconfig.options,
      host: tsHost,
    });

    // using ts-paths-transformer to transform tsconfig paths to relative path
    // reason: https://github.com/microsoft/TypeScript/issues/30952
    // ref: https://www.npmjs.com/package/typescript-transform-paths
    // proxy pathsPatterns to avoid transform paths out of cwd
    // ref: https://github.com/LeDDGroup/typescript-transform-paths/blob/06c317839ca2f2426ad5c39c640e231f739af115/src/transformer.ts#L136-L140
    const proxyTs = new Proxy(ts, {
      get(target: any, prop) {
        // typescript internal method since 4.4.x
        const PROXY_KEY = 'tryParsePatterns';

        return prop === PROXY_KEY
          ? () => target[PROXY_KEY](transformPaths)
          : target[prop];
      },
    });
    const result = incrProgram.emit(undefined, undefined, undefined, true, {
      afterDeclarations: [
        tsPathsTransformer(
          incrProgram.getProgram(),
          { afterDeclarations: true },
          // specific typescript instance, because this plugin is incompatible with typescript@4.9.x currently
          // but some project may declare typescript and some dependency manager will hoist project's typescript
          // rather than father's typescript for this plugin
          { ts: proxyTs },
        ),
      ],
    });

    // save cache
    // why save cache before check compile error?
    // because ts compiler will compile files incrementally in the next time, so the correct d.ts files may lost if not save cache
    // and don't worry the wrong d.ts save to cache, it will be override by the new content in the next time
    Object.keys(cacheRets).forEach((key) => cache.setSync(key, cacheRets[key]));

    // check compile error
    // ref: https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#a-minimal-compiler
    const diagnostics = ts
      .getPreEmitDiagnostics(incrProgram.getProgram())
      .concat(result.diagnostics)
      // omit error for files which not included by build
      .filter((d) => !d.file || inputFiles.includes(d.file.fileName));

    /* istanbul ignore if -- @preserve */
    if (diagnostics.length) {
      diagnostics.forEach((d) => {
        const fragments: string[] = [];

        // show file path & line number
        if (d.file && d.start) {
          const rltPath = winPath(path.relative(opts.cwd, d.file!.fileName));
          const loc = ts.getLineAndCharacterOfPosition(d.file!, d.start!);

          fragments.push(
            `${chalk.blueBright(rltPath)}:${
              // correct line number & column number, ref: https://github.com/microsoft/TypeScript/blob/93f2d2b9a1b2f8861b49d76bb5e58f6e9f2b56ee/src/compiler/tracing.ts#L185
              `${chalk.yellow(loc.line + 1)}:${chalk.yellow(
                loc.character + 1,
              )} -`
            }`,
          );
        }

        // show error code
        fragments.push(chalk.gray(`TS${d.code}:`));
        // show error message
        fragments.push(ts.flattenDiagnosticMessageText(d.messageText, '\n'));

        logger.error(fragments.join(' '));
      });
      throw new Error('Declaration generation failed.');
    }
  }

  return output;
}
