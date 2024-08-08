import path from 'path';
import { Piscina } from 'piscina';
import type { IBundlessConfig } from 'src/builder/config';
import { IApi } from 'src/types';
import type { Loaders, Transformers } from '.';

export default () =>
  new Piscina<{
    fileAbsPath: string;
    loaders: Loaders;
    fileDistPath: string;
    transformers: Transformers;
    opts: {
      config: IBundlessConfig;
      pkg: IApi['pkg'];
      cwd: string;
      itemDistAbsPath: string;
    };
  }>({
    filename: path.resolve(__dirname + '/loaders/index.js'),
    idleTimeout: 30000,
    recordTiming: false,
  });
