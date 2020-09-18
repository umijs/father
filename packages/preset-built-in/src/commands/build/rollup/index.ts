import fs from 'fs';
import path from 'path';
import { rollup, watch, RollupOptions, OutputOptions } from 'rollup';
import { IConfig } from 'father-types';
import getRollupConfig from './getRollupConfig';
import { Service } from '@umijs/core';
import { lodash, winPath } from '@umijs/utils';

const DEFAULT_ENTRIES = [
  'src/index.tsx',
  'src/index.ts',
  'src/index.jsx',
  'src/index.js',
];

/**
 * get entry list for project
 * @param config  original config
 */
function getEntries({ config, cwd, pkg }: IRollupBuildOpts) {
  const entries = Object.keys(config.rollup?.entry || {}).reduce(
    (result, file) => ({
      ...result,
      // strip head dot for file path
      [file]: winPath(path.join(config.rollup!.entry![file])),
    }),
    {} as { [key: string]: string },
  );
  const pkgFile = pkg.name
    ? lodash.camelCase(path.basename(pkg.name))
    : 'index';

  // fallback to default entry if there has no entry or has not default entry
  if (
    !entries[pkgFile] &&
    Object.values(entries).every(file => DEFAULT_ENTRIES.includes(file))
  ) {
    const defaultEntry = DEFAULT_ENTRIES.find(entry =>
      fs.existsSync(path.join(cwd, entry)),
    );

    if (defaultEntry) {
      entries[pkgFile] = defaultEntry;
    }
  }

  return entries;
}

/**
 * return bundle options array group by each entry
 * @param opts  original config
 */
function getBundleOpts(opts: IRollupBuildOpts): IConfig[] {
  const { config } = opts;
  const { rollup, ...userConfig } = config;
  const entries = getEntries(opts);

  return Object.keys(entries).map(file => ({
    // extract rollup opts for each single entry
    rollup: {
      ...rollup,
      entry: {
        [file]: entries[file],
      },
    },
    // extract common opts
    ...userConfig,
  }));
}

interface IRollupBuildOpts {
  cwd: string;
  config: IConfig;
  pkg: typeof Service.prototype.pkg;
  moduleType: any;
  watch?: boolean;
  tsConfig?: any;
}

export default async (opts: IRollupBuildOpts) => {
  const bundleOptsArray = getBundleOpts(opts);
  const rollupOptsArray = bundleOptsArray.reduce(
    (configs, config) => configs.concat(getRollupConfig({ ...opts, config })),
    [] as RollupOptions[],
  );

  for (let i = 0; i < rollupOptsArray.length; i += 1) {
    const rollupOpts = rollupOptsArray[i];

    if (opts.watch) {
      const watcher = watch([
        {
          ...rollupOpts,
          watch: {},
        },
      ]);

      watcher.on('event', ev => {
        if (ev.code === 'ERROR') {
          console.log(ev.error);
        }
      });

      process.once('SIGINT', () => {
        watcher.close();
      });
    } else {
      const { output, ...input } = rollupOpts;
      const bundle = await rollup(input);

      await bundle.write(output as OutputOptions);
    }
  }
};
