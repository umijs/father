import { join, extname, relative } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import vfs from 'vinyl-fs';
import signale from 'signale';
import rimraf from 'rimraf';
import through from 'through2';
import slash from 'slash2';
import * as chokidar from 'chokidar';
import * as babel from '@babel/core';
import gulpTs from 'gulp-typescript';
import gulpLess from 'gulp-less';
import gulpIf from 'gulp-if';
import getBabelConfig from './getBabelConfig';
import { IBundleOptions } from './types';

interface IBabelOpts {
  cwd: string;
  rootPath?: string;
  type: 'esm' | 'cjs';
  target?: 'browser' | 'node';
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
    bundleOpts: {
      target = 'browser',
      runtimeHelpers,
      extraBabelPresets = [],
      extraBabelPlugins = [],
      browserFiles = [],
      nodeFiles = [],
      nodeVersion,
      disableTypeCheck,
      lessInBabelMode,
    },
  } = opts;
  const srcPath = join(cwd, 'src');
  const targetDir = type === 'esm' ? 'es' : 'lib';
  const targetPath = join(cwd, targetDir);

  signale.info(`Clean ${targetDir} directory`);
  rimraf.sync(targetPath);

  function transform(opts: ITransformOpts) {
    const { file, type } = opts;
    signale.info(`[${type}] Transform: ${slash(file.path).replace(`${cwd}/`, '')}`);

    const babelOpts = getBabelConfig({
      target,
      type,
      typescript: true,
      runtimeHelpers,
      filePath: slash(relative(cwd, file.path)),
      browserFiles,
      nodeFiles,
      nodeVersion,
    });
    if (importLibToEs && type === 'esm') {
      babelOpts.plugins.push(require.resolve('../lib/importLibToEs'));
    }
    babelOpts.presets.push(...extraBabelPresets);
    babelOpts.plugins.push(...extraBabelPlugins);

    return babel.transform(file.contents, {
      ...babelOpts,
      filename: file.path,
    }).code;
  }

  function getTSConfig() {
    const tsconfigPath = join(cwd, 'tsconfig.json');
    const templateTsconfigPath = join(__dirname, '../template/tsconfig.json');

    if (existsSync(tsconfigPath)) {
      return JSON.parse(readFileSync(tsconfigPath, 'utf-8')).compilerOptions || {};
    }
    if (rootPath && existsSync(join(rootPath, 'tsconfig.json'))) {
      return JSON.parse(readFileSync(join(rootPath, 'tsconfig.json'), 'utf-8')).compilerOptions || {};
    }
    return JSON.parse(readFileSync(templateTsconfigPath, 'utf-8')).compilerOptions || {};
  }

  function createStream(src) {
    const tsConfig = getTSConfig();
    const babelTransformRegexp = disableTypeCheck ? /\.(t|j)sx?$/ : /\.jsx?$/;

    function isTsFile(path) {
      return /\.tsx?$/.test(path) && !path.endsWith('.d.ts');
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
              cb(null);
            }
          }),
        ),
      )
      .pipe(vfs.dest(targetPath));
  }

  return new Promise(resolve => {
    createStream([
      join(srcPath, '**/*'),
      `!${join(srcPath, '**/fixtures/**/*')}`,
      `!${join(srcPath, '**/*.mdx')}`,
      `!${join(srcPath, '**/*.+(test|e2e|spec).+(js|jsx|ts|tsx)')}`,
    ]).on('end', () => {
      if (watch) {
        signale.info('Start watch', srcPath);
        chokidar
          .watch(srcPath, {
            ignoreInitial: true,
          })
          .on('all', (event, fullPath) => {
            const relPath = fullPath.replace(srcPath, '');
            signale.info(`[${event}] ${join(srcPath, relPath)}`);
            if (!existsSync(fullPath)) return;
            if (statSync(fullPath).isFile()) {
              createStream([fullPath]);
            }
          });
      }
      resolve();
    });
  });
}
