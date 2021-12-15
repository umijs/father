import fs from 'fs';
import path from 'path';
import { glob, winPath } from '@umijs/utils';
import runLoaders from './loaders';
import type {
  IFatherBaseConfig,
  IFatherBundlessConfig,
  IFatherBuildTypes,
} from '../../types';

/**
 * declare bundless config
 */
export interface IBundlessConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundlessConfig, 'input' | 'overrides'> {
  type: IFatherBuildTypes.BUNDLESS;
  input: string;
}

export default async (config: IBundlessConfig) => {
  const matches: string[] = [];

  if (fs.lstatSync(config.input).isDirectory()) {
    // match all available files within directory
    matches.push(
      ...glob.sync(`${config.input}/**`, {
        ignore: config.ignores,
      }),
    );
  } else {
    // match single file
    matches.push(config.input);
  }

  // process all matched items
  for (let item of matches) {
    let itemDistPath = winPath(
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
  }

  // TODO: watch mode
};
