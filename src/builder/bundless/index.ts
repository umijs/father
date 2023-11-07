import {
  chalk,
  chokidar,
  debug,
  glob,
  lodash,
  rimraf,
  winPath,
} from '@umijs/utils';
import fs from 'fs';
import path from 'path';
import {
  DEBUG_BUNDLESS_NAME,
  DEFAULT_BUNDLESS_IGNORES,
  WATCH_DEBOUNCE_STEP,
} from '../../constants';
import { logger } from '../../utils';
import type { BundlessConfigProvider } from '../config';
import getDeclarations from './dts';
import runLoaders from './loaders';

const debugLog = debug(DEBUG_BUNDLESS_NAME);

/**
 * replace extension for path
 */
function replacePathExt(filePath: string, ext: string) {
  const parsed = path.parse(filePath);

  return path.join(parsed.dir, `${parsed.name}${ext}`);
}

/**
 * transform specific files
 */
async function transformFiles(
  files: string[],
  opts: {
    cwd: string;
    configProvider: BundlessConfigProvider;
    watch?: true;
  },
) {
  try {
    let count = 0;
    const declarationFileMap = new Map<string, string>();

    // process all matched items
    for (let item of files) {
      const config = opts.configProvider.getConfigForFile(item);
      const itemAbsPath = path.join(opts.cwd, item);

      if (config) {
        let itemDistPath = path.join(
          config.output!,
          path.relative(config.input, item),
        );
        let itemDistAbsPath = path.join(opts.cwd, itemDistPath);
        const parentPath = path.dirname(itemDistAbsPath);

        // create parent directory if not exists
        if (!fs.existsSync(parentPath)) {
          fs.mkdirSync(parentPath, { recursive: true });
        }

        // get result from loaders
        const result = await runLoaders(itemAbsPath, {
          config,
          pkg: opts.configProvider.pkg,
          cwd: opts.cwd,
          itemDistAbsPath,
        });

        if (result) {
          // update ext if loader specified
          if (result.options.ext) {
            itemDistPath = replacePathExt(itemDistPath, result.options.ext);
            itemDistAbsPath = replacePathExt(
              itemDistAbsPath,
              result.options.ext,
            );
          }

          // prepare for declaration
          if (result.options.declaration) {
            // use winPath because ts compiler will convert to posix path
            declarationFileMap.set(winPath(itemAbsPath), parentPath);
          }

          if (result.options.map) {
            const map = result.options.map;
            const mapLoc = `${itemDistAbsPath}.map`;

            fs.writeFileSync(mapLoc, map);
          }

          // distribute file with result
          fs.writeFileSync(itemDistAbsPath, result.content);
        } else {
          // copy file as normal assets
          fs.copyFileSync(itemAbsPath, itemDistAbsPath);
        }

        logger.quietExpect.event(
          `Bundless ${chalk.gray(item)} to ${chalk.gray(itemDistPath)}${
            result?.options.declaration ? ' (with declaration)' : ''
          }`,
        );
        count += 1;
      } else {
        debugLog(`No config matches ${chalk.gray(item)}, skip`);
      }
    }

    if (declarationFileMap.size) {
      logger.quietExpect.event(
        `Generate declaration file${declarationFileMap.size > 1 ? 's' : ''}...`,
      );

      const declarations = await getDeclarations(
        [...declarationFileMap.keys()],
        {
          cwd: opts.cwd,
        },
      );

      declarations.forEach((item) => {
        fs.writeFileSync(
          path.join(declarationFileMap.get(item.sourceFile)!, item.file),
          item.content,
          'utf-8',
        );
      });
    }

    return count;
  } catch (err: any) {
    if (opts.watch) {
      logger.error(err.message);
      return 0;
    } else {
      throw err;
    }
  }
}

// overload normal/watch mode
function bundless(
  opts: Omit<Parameters<typeof transformFiles>[1], 'watch'>,
): Promise<void>;
function bundless(
  opts: Parameters<typeof transformFiles>[1],
): Promise<chokidar.FSWatcher>;

async function bundless(
  opts: Parameters<typeof transformFiles>[1],
): Promise<void | chokidar.FSWatcher> {
  const statusText = `Bundless for ${chalk.yellow(
    opts.configProvider.input,
  )} directory to ${chalk.yellow(
    opts.configProvider.configs[0].format,
  )} format`;

  logger.info(statusText);

  const startTime = Date.now();
  const matches = glob.sync(`${opts.configProvider.input}/**`, {
    cwd: opts.cwd,
    ignore: DEFAULT_BUNDLESS_IGNORES,
    nodir: true,
  });
  const count = await transformFiles(matches, opts);

  if (!opts.watch) {
    // output result for normal mode
    logger.quietExpect.event(
      `Transformed successfully in ${
        Date.now() - startTime
      } ms (${count} files)`,
    );
  } else {
    // watching for watch mode
    logger.quietExpect.event(
      `Start watching ${opts.configProvider.input} directory...`,
    );

    // debounce transform to combine multiple changes
    const handleTransform = (() => {
      const pendingSet = new Set<string>();
      const startTransform = lodash.debounce(() => {
        transformFiles([...pendingSet], opts);
        pendingSet.clear();
        logger.quietOnly.info(statusText);
      }, WATCH_DEBOUNCE_STEP);

      return (filePath: string) => {
        pendingSet.add(filePath);
        startTransform();
      };
    })();
    const watcher = chokidar
      .watch(opts.configProvider.input, {
        cwd: opts.cwd,
        ignoreInitial: true,
        ignored: DEFAULT_BUNDLESS_IGNORES,
        // to avoid catch temp file from some special file-system
        // ex. a.txt => a.txt.12344345 in CloudIDE
        awaitWriteFinish: {
          stabilityThreshold: 20,
          pollInterval: 10,
        },
      })
      .on('add', handleTransform)
      .on('change', handleTransform)
      .on('unlink', (rltFilePath) => {
        const isTsFile = /\.tsx?$/.test(rltFilePath);
        const config = opts.configProvider.getConfigForFile(rltFilePath);

        // no config means it was ignored in current compile-time
        // such as esm file in cjs compile-time
        if (config) {
          const fileDistAbsPath = path.join(
            opts.cwd,
            config.output!,
            path.relative(config.input, rltFilePath),
          );
          // TODO: collect real emit files
          const relatedFiles = isTsFile
            ? [
                replacePathExt(fileDistAbsPath, '.js'),
                replacePathExt(fileDistAbsPath, '.d.ts'),
                replacePathExt(fileDistAbsPath, '.d.ts.map'),
              ]
            : [fileDistAbsPath];
          const relatedMainFile = relatedFiles.find((item) =>
            fs.existsSync(item),
          );

          if (relatedMainFile) {
            relatedFiles.forEach((file) => rimraf.sync(file));
            logger.quietExpect.event(
              `Bundless ${chalk.gray(
                path.relative(opts.cwd, relatedMainFile),
              )} is removed`,
            );
          }
        }
      })
      .on('unlinkDir', (rltDirPath: string) => {
        const config = opts.configProvider.getConfigForFile(rltDirPath);

        // no config means it was ignored in current compile-time
        // such as esm file in cjs compile-time
        if (config) {
          const dirDistAbsPath = path.join(
            opts.cwd,
            config.output!,
            path.relative(config.input, rltDirPath),
          );

          // there are file removal logs above, so we don't need to log here
          rimraf.sync(dirDistAbsPath);
        }
      });

    return watcher;
  }
}

export default bundless;
