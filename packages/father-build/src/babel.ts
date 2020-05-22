import { join, extname, relative } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import vfs from 'vinyl-fs';
import signale from 'signale';
import lodash from 'lodash';
import rimraf from 'rimraf';
import through from 'through2';
import slash from 'slash2';
import * as chokidar from 'chokidar';
import * as babel from '@babel/core';
import gulpTs from 'gulp-typescript';
import gulpLess from 'gulp-less';
import gulpIf from 'gulp-if';
import chalk from "chalk";
import getBabelConfig from './getBabelConfig';
import { IBundleOptions } from './types';
import * as ts from 'typescript';

interface IBabelOpts {
  cwd: string;
  rootPath?: string;
  type: 'esm' | 'cjs';
  target?: 'browser' | 'node';
  log?: (string) => void;
  watch?: boolean;
  importLibToEs?: boolean;
  bundleOpts: IBundleOptions;
}

interface ITransformOpts {
  file: {
    contents: string;
    path: string;
  };
  type: 'esm' | 'cjs';
}

export default async function(opts: IBabelOpts) {
  const {
    cwd,
    rootPath,
    type,
    watch,
    importLibToEs,
    log,
    bundleOpts: {
      target = 'browser',
      runtimeHelpers,
      extraBabelPresets = [],
      extraBabelPlugins = [],
      browserFiles = [],
      nodeFiles = [],
      nodeVersion,
      disableTypeCheck,
      cjs,
      lessInBabelMode,
    },
  } = opts;
  const srcPath = join(cwd, 'src');
  const targetDir = type === 'esm' ? 'es' : 'lib';
  const targetPath = join(cwd, targetDir);

  log(chalk.gray(`Clean ${targetDir} directory`));
  rimraf.sync(targetPath);

  function transform(opts: ITransformOpts) {
    const { file, type } = opts;
    const { opts: babelOpts, isBrowser } = getBabelConfig({
      target,
      type,
      typescript: true,
      runtimeHelpers,
      filePath: slash(relative(cwd, file.path)),
      browserFiles,
      nodeFiles,
      nodeVersion,
      lazy: cjs && cjs.lazy,
      lessInBabelMode,
    });
    if (importLibToEs && type === 'esm') {
      babelOpts.plugins.push(require.resolve('../lib/importLibToEs'));
    }
    babelOpts.presets.push(...extraBabelPresets);
    babelOpts.plugins.push(...extraBabelPlugins);

    const relFile = slash(file.path).replace(`${cwd}/`, '');
    log(`Transform to ${type} for ${chalk[isBrowser ? 'yellow' : 'blue'](relFile)}`);

    return babel.transform(file.contents, {
      ...babelOpts,
      filename: file.path,
    }).code;
  }

  /**
   * tsconfig.json is not valid json file
   * https://github.com/Microsoft/TypeScript/issues/20384
   */
  function parseTsconfig(path: string) {
    const readFile = (path:string) => readFileSync(path, 'utf-8')
    const result = ts.readConfigFile(path, readFile)
    if (result.error) {
      return
    }
    return result.config
  }

  function getTsconfigCompilerOptions(path: string) {
    const config = parseTsconfig(path)
    return config ? config.compilerOptions : undefined
  }
  function getTsconfigInclude(path: string) {
    const config = parseTsconfig(path)
    const includesPath = config?.include ?? []
    return includesPath
  }
  function getTSConfig() {
    const tsconfigPath = join(cwd, 'tsconfig.json');
    const templateTsconfigPath = join(__dirname, '../template/tsconfig.json');

    if (existsSync(tsconfigPath)) {
      return getTsconfigCompilerOptions(tsconfigPath) || {};
    }
    if (rootPath && existsSync(join(rootPath, 'tsconfig.json'))) {
      return getTsconfigCompilerOptions(join(rootPath, 'tsconfig.json')) || {};
    }
    return getTsconfigCompilerOptions(templateTsconfigPath) || {};
  }
  
  function getTSMatch() {
    const tsconfigPath = join(cwd, 'tsconfig.json');
    const templateTsconfigPath = join(__dirname, '../template/tsconfig.json');
    if (existsSync(tsconfigPath)) {
      return getTsconfigInclude(tsconfigPath) || [];
    }
    if (rootPath && existsSync(join(rootPath, 'tsconfig.json'))) {
      return getTsconfigInclude(join(rootPath, 'tsconfig.json')) || [];
    }
    return getTsconfigInclude(templateTsconfigPath) || [];
  }

  function createStream(src) {
    const tsConfig = getTSConfig();
    const babelTransformRegexp = disableTypeCheck ? /\.(t|j)sx?$/ : /\.jsx?$/;

    function isTsFile(path) {
      const isTypings = path.endsWith('typings.d.ts');
      return isTypings || (/\.tsx?$/.test(path) && !path.endsWith('.d.ts'));
    }

    function isTransform(path) {
      return babelTransformRegexp.test(path) && !path.endsWith('.d.ts');
    }

    return vfs
      .src(src, {
        allowEmpty: true,
        base: srcPath,
      })
      .pipe(gulpIf(f => !disableTypeCheck && isTsFile(f.path), gulpTs(tsConfig)))
      .pipe(gulpIf(f => lessInBabelMode && /\.less$/.test(f.path), gulpLess(lessInBabelMode || {})))
      .pipe(
        gulpIf(
          f => isTransform(f.path),
          through.obj((file, env, cb) => {
            try {
              file.contents = Buffer.from(
                transform({
                  file,
                  type,
                }),
              );
              // .jsx -> .js
              file.path = file.path.replace(extname(file.path), '.js');
              cb(null, file);
            } catch (e) {
              signale.error(`Compiled faild: ${file.path}`);
              console.log(e);
              cb(null);
            }
          }),
        ),
      )
      .pipe(vfs.dest(targetPath));
  }

  return new Promise(resolve => {
    const includes = getTSMatch().map(item => join(srcPath, item))
    const patterns = [
      join(srcPath, '../typings.d.ts'),
      join(srcPath, '../index.d.ts'),
      join(srcPath, '../typings/index.d.ts'),
      ...includes,
      join(srcPath, '**/*'),
      `!${join(srcPath, '**/fixtures{,/**}')}`,
      `!${join(srcPath, '**/demos{,/**}')}`,
      `!${join(srcPath, '**/__test__{,/**}')}`,
      `!${join(srcPath, '**/*.mdx')}`,
      `!${join(srcPath, '**/*.md')}`,
      `!${join(srcPath, '**/*.+(test|e2e|spec).+(js|jsx|ts|tsx)')}`,
    ];
    createStream(patterns).on('end', () => {
      if (watch) {
        log(chalk.magenta(`Start watching ${slash(srcPath).replace(`${cwd}/`, '')} directory...`));
        const watcher = chokidar
          .watch(patterns, {
            ignoreInitial: true,
          });

        const files = [];
        function compileFiles() {
          while (files.length) {
            createStream(files.pop());
          }
        }

        const debouncedCompileFiles = lodash.debounce(compileFiles, 1000);
        watcher.on('all', (event, fullPath) => {
          const relPath = fullPath.replace(srcPath, '');
          log(`[${event}] ${slash(join(srcPath, relPath)).replace(`${cwd}/`, '')}`);
          if (!existsSync(fullPath)) return;
          if (statSync(fullPath).isFile()) {
            if (!files.includes(fullPath)) files.push(fullPath);
            debouncedCompileFiles();
          }
        });
        process.once('SIGINT', () => {
          watcher.close();
        });
      }
      resolve();
    });
  });
}
