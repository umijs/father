import { chalk, chokidar, glob, lodash, logger, winPath } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
import type { BundlessConfigProvider } from '../config';
import getDeclarations from './dts';
import runLoaders from './loaders';

const DEFAULT_BUNDLESS_IGNORES = [
  '**/*.md',
  '**/__{test,tests}__/**',
  '**/*.{test,e2e,spec}.{js,jsx,ts,tsx}',
];

function replacePathExt(filePath: string, ext: string) {
  const parsed = path.parse(filePath);

  return path.join(parsed.dir, `${parsed.name}${ext}`);
}

export default async (opts: {
  cwd: string;
  configProvider: BundlessConfigProvider;
  watch?: boolean;
}) => {
  logger.info(
    `Bundless for ${chalk.yellow(
      opts.configProvider.input,
    )} directory to ${chalk.yellow(
      opts.configProvider.configs[0].format,
    )} format`,
  );
  const declarationFileMap = new Map<string, string>();
  async function transfromFile(filePaths: string[]) {
    let count = 0;
    const startTime = Date.now();

    // process all matched items
    for (let item of filePaths) {
      const config = opts.configProvider.getConfigForFile(item);
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
        const result = await runLoaders(item, {
          config,
          pkg: opts.configProvider.pkg,
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
            declarationFileMap.set(item, parentPath);
          }

          // distribute file with result
          fs.writeFileSync(itemDistAbsPath, result.content);
        } else {
          // copy file as normal assets
          fs.copyFileSync(item, itemDistAbsPath);
        }

        logger.event(
          `Bundless ${chalk.gray(item)} to ${chalk.gray(itemDistPath)}${
            result?.options.declaration ? ' (with declaration)' : ''
          }`,
        );
        count += 1;
      } else {
        // TODO: DEBUG
      }
    }
    if (declarationFileMap.size) {
      logger.event(`Generate declaration files...`);

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

    logger.event(
      `Transformed successfully in ${
        Date.now() - startTime
      } ms (${count} files)`,
    );
  }
  const matches = glob.sync(`${opts.configProvider.input}/**`, {
    cwd: opts.cwd,
    ignore: DEFAULT_BUNDLESS_IGNORES,
    nodir: true,
  });
  await transfromFile(matches);

  if (opts.watch) {
    logger.event(`Start watching ${opts.configProvider.input} directory...`);
    const watcher = chokidar
      .watch(opts.configProvider.input, {
        ignoreInitial: true,
        ignored: DEFAULT_BUNDLESS_IGNORES,
      })
      .on('add', (filePath: string) => {
        transfromFile([winPath(filePath)]);
      })
      .on(
        'change',
        lodash.debounce((filePath: string) => {
          transfromFile([winPath(filePath)]);
        }, 300),
      )
      .on('unlink', (filePath: string) => {
        const relativePath = winPath(
          filePath.replace(path.join(opts.cwd, '/'), ''),
        );
        const config = opts.configProvider.getConfigForFile(relativePath);
        const itemDistPath = path.join(
          config.output!,
          path.relative(config.input, relativePath),
        );
        const itemDistAbsPath = path.join(opts.cwd, itemDistPath);
        const parentPath = path.dirname(itemDistAbsPath);

        if (!fs.existsSync(parentPath)) return;

        const ext = path.extname(filePath);
        const name = path.basename(filePath).replace(ext, '');

        if (ext === '') {
          fs.rmSync(path.join(parentPath, name), { force: true });
        } else if (['.js', '.jsx'].includes(ext)) {
          fs.rmSync(path.join(parentPath, name + '.js'), {
            force: true,
          });
        } else if (['.ts', '.tsx'].includes(ext)) {
          ['.js', '.d.ts', '.d.ts.map'].map((ext) => {
            fs.rmSync(path.join(parentPath, name + ext), {
              force: true,
            });
          });
        }

        logger.event(`Removed ${filePath} successfully)`);
      })
      .on('unlinkDir', (dirPath: string) => {
        //  When the event is equal to unlinkDir, Path may be an absolute Path
        const relativeDirPath = winPath(
          dirPath.replace(path.join(opts.cwd, '/'), ''),
        );
        const config = opts.configProvider.getConfigForFile(relativeDirPath);
        const itemDistPath = path.join(
          config.output!,
          path.relative(config.input, relativeDirPath),
        );
        const itemDistAbsPath = path.join(opts.cwd, itemDistPath);

        if (!fs.existsSync(itemDistAbsPath)) return;
        fs.rmdirSync(itemDistAbsPath, { recursive: true });

        logger.event(`Removed Dir ${relativeDirPath} successfully)`);
      });

    return watcher;
  }
};
