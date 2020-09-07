import { rimraf, chokidar, winPath, lodash } from '@umijs/utils';
import { IConfig } from 'father-types';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import vfs from 'vinyl-fs';
import gulpPlumber from 'gulp-plumber';
import gulpBabel from 'gulp-babel';
import gulpIf from 'gulp-if';
import gulpTs from 'gulp-typescript';
import gulpLess from 'gulp-less';
import through from 'through2';
import getBabelConfig from './getBabelConfig';
import { getRelativePath } from './utils';

export default async function(opts: {
  cwd: string;
  config: IConfig;
  moduleType: string;
  watch?: boolean;
  tsConfig?: any;
}) {
  const { cwd, moduleType, config, watch, tsConfig } = opts;

  const srcPath = join(cwd, 'src');
  const targetDir = moduleType === 'esm' ? 'es' : 'lib';
  const targetPath = join(cwd, targetDir);

  rimraf.sync(targetPath);

  function isTsFile(path: string) {
    return /\.tsx?$/.test(path) && !path.endsWith('.d.ts');
  }

  function isLessFile(path: string) {
    return /\.less$/.test(path);
  }

  function isTransformWithBabel(path: string) {
    return /\.[tj]sx?$/.test(path) && !path.endsWith('.d.ts');
  }

  function isBrowser(path: string) {
    // tsx 文件始终为 browser 模式
    if (path.endsWith('.tsx')) return true;
    return config.target === 'browser';
  }

  function createStream({ patterns }: { patterns: string[] }) {
    const lessConfig = {};
    const browserBabelConfig = getBabelConfig({
      config,
      moduleType,
      isBrowser: true,
    });
    const nodeBabelConfig = getBabelConfig({
      config,
      moduleType,
      isBrowser: false,
    });

    return new Promise(resolve => {
      vfs
        .src(patterns, {
          allowEmpty: true,
          base: srcPath,
        })
        .pipe(watch ? gulpPlumber() : through.obj())
        .pipe(
          gulpIf(f => isTsFile(f.path), gulpTs(tsConfig.compilerOptions || {})),
        )
        .pipe(gulpIf(f => isLessFile(f.path), gulpLess(lessConfig)))
        .pipe(
          gulpIf(
            // @ts-ignore
            f => {
              return isTransformWithBabel(f.path) && isBrowser(f.path);
            },
            // @ts-ignore
            gulpBabel(browserBabelConfig),
          ),
        )
        .pipe(
          gulpIf(
            // @ts-ignore
            f => {
              return isTransformWithBabel(f.path) && !isBrowser(f.path);
            },
            // @ts-ignore
            gulpBabel(nodeBabelConfig),
          ),
        )
        .pipe(
          through.obj((file, env, cb) => {
            console.log(
              `Transform to ${moduleType} for ${getRelativePath(
                file.path,
                cwd,
              )}`,
            );
            cb(null, file);
          }),
        )
        .pipe(vfs.dest(targetPath))
        .on('end', resolve);
    });
  }

  // TODO: 支持修改
  const ignoredFiles = ['mdx', 'md', '(test|e2e|spec).(js|jsx|ts|tsx)'];
  const ignoredDirectories = ['__test__', 'demos', 'fixtures'];
  const patterns = [
    join(srcPath, '**/*'),
    ...ignoredDirectories.map(d => `!${join(srcPath, `**/${d}{,/**}`)}`),
    ...ignoredFiles.map(f => `!${join(srcPath, `**/*.${f}`)}`),
  ];
  await createStream({ patterns });

  if (watch) {
    // 递增的文件编译
    const files: string[] = [];
    const compileFiles = () => {
      createStream({
        patterns: files,
      });
      files.length = 0;
    };
    const debouncedCompileFiles = lodash.debounce(compileFiles, 1000);

    const watcher = chokidar.watch(patterns, {
      ignoreInitial: true,
    });
    watcher.on('all', (event, fullPath) => {
      const path = winPath(fullPath);
      console.log(
        `[${event}] [${moduleType}] ${getRelativePath(fullPath, cwd)}`,
      );
      if (existsSync(path) && statSync(fullPath).isFile()) {
        if (!files.includes(path)) {
          files.push(path);
        }
        debouncedCompileFiles();
      }
    });
  }
}
