import { glob, logger, rimraf, winPath } from '@umijs/utils';
import fs from 'fs';
import path from 'path';
import type { BundlessConfigProvider } from '../config';
import runLoaders from './loaders';

const DEFAULT_BUNDLESS_IGNORES = [
  '**/*.md',
  '**/__{test,tests}__/**',
  '**/*.{test,e2e,spec}.{js,jsx,ts,tsx}',
];

export default async (opts: {
  cwd: string;
  configProvider: BundlessConfigProvider;
}) => {
  // clean dist dir
  rimraf.sync(opts.configProvider.output);

  logger.info(
    `[bundless] for ${path.relative(
      opts.cwd,
      opts.configProvider.input,
    )} directory`,
  );

  const matches = glob
    .sync(`${opts.configProvider.input}/**`, {
      ignore: DEFAULT_BUNDLESS_IGNORES,
    })
    // ignore input directory
    .slice(1);

  // process all matched items
  for (let item of matches) {
    const config = opts.configProvider.getConfigForPath(item);

    if (config) {
      const itemDistPath = winPath(
        path.join(config.output!, path.relative(config.input, item)),
      );

      if (fs.lstatSync(item).isDirectory()) {
        // mkdir in dist
        fs.mkdirSync(itemDistPath, { recursive: true });
      } else {
        // get result from loaders
        const result = await runLoaders(item, config);

        if (result) {
          // distribute file with result
          fs.writeFileSync(itemDistPath, result);
        } else {
          // copy file as normal assets
          fs.copyFileSync(item, itemDistPath);
        }
      }
    } else {
      // TODO: DEBUG
    }
  }

  // TODO: watch mode
};
