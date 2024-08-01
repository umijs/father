import { chokidar, rimraf } from '@umijs/utils';
import path from 'path';
import { IApi, IFatherConfig } from '../types';
import { logger } from '../utils';
import bundle, { type IBundleWatcher } from './bundle';
import bundless from './bundless';
import { createConfigProviders } from './config';

function getProviderOutputs(
  providers: ReturnType<typeof createConfigProviders>,
) {
  const set = new Set<string>();

  [
    providers.bundle?.configs,
    providers.bundless.esm?.configs,
    providers.bundless.cjs?.configs,
  ].forEach((configs) => {
    configs?.forEach((config) => {
      set.add(
        typeof config.output === 'string' ? config.output : config.output!.path,
      );
    });
  });

  return Array.from(set);
}

interface IBuilderOpts {
  userConfig: IFatherConfig;
  cwd: string;
  pkg: IApi['pkg'];
  clean?: boolean;
  buildDependencies?: string[];
}

interface IWatchBuilderResult {
  close: chokidar.FSWatcher['close'];
}

// overload normal/watch mode
function builder(opts: IBuilderOpts): Promise<void>;
function builder(
  opts: IBuilderOpts & { watch: true; incremental?: boolean },
): Promise<IWatchBuilderResult>;

async function builder(
  opts: IBuilderOpts & { watch?: true; incremental?: boolean },
): Promise<IWatchBuilderResult | void> {
  const configProviders = createConfigProviders(
    opts.userConfig,
    opts.pkg,
    opts.cwd,
  );
  const outputs = getProviderOutputs(configProviders);
  const watchers: (chokidar.FSWatcher | IBundleWatcher)[] = [];

  if (opts.clean !== false && !opts.incremental) {
    // clean output directories
    logger.quietExpect.info('Clean output directories');
    outputs.forEach((output) => {
      rimraf.sync(path.join(opts.cwd, output));
    });
  }

  if (configProviders.bundle) {
    const watcher = await bundle({
      cwd: opts.cwd,
      configProvider: configProviders.bundle,
      buildDependencies: opts.buildDependencies,
      watch: opts.watch,
      incremental: opts.incremental,
    });

    opts.watch && watchers.push(watcher);
  }

  if (configProviders.bundless.esm) {
    const watcher = await bundless({
      cwd: opts.cwd,
      configProvider: configProviders.bundless.esm,
      watch: opts.watch,
      incremental: opts.incremental,
    });

    opts.watch && watchers.push(watcher);
  }

  if (configProviders.bundless.cjs) {
    const watcher = await bundless({
      cwd: opts.cwd,
      configProvider: configProviders.bundless.cjs,
      watch: opts.watch,
      incremental: opts.incremental,
    });

    opts.watch && watchers.push(watcher);
  }

  if (opts.watch) {
    return {
      async close() {
        await Promise.all(watchers.map((watcher) => watcher.close()));
      },
    };
  }
}

export default builder;
