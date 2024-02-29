import type { webpack } from '@umijs/bundler-webpack';
import type { BundleConfigProvider } from '../config';
import makoBundle from './mako';
import webpackBundle from './webpack';

export interface IBundleWatcher {
  close: () => void;
}

interface IBundleOpts {
  cwd: string;
  configProvider: BundleConfigProvider;
  buildDependencies?: string[];
  watch?: boolean;
}

function bundle(opts: Omit<IBundleOpts, 'watch'>): Promise<void>;
function bundle(opts: IBundleOpts): Promise<IBundleWatcher>;
async function bundle(opts: IBundleOpts): Promise<void | IBundleWatcher> {
  const closeHandlers: webpack.Watching['close'][] = [];

  for (let i = 0; i < opts.configProvider.configs.length; i += 1) {
    const config = opts.configProvider.configs[i];

    if (process.env.OKAM && config.bundler === 'mako') {
      await makoBundle(opts, config);
    } else {
      await webpackBundle(opts, config, closeHandlers);
    }
  }

  // return watching closer for watch mode
  if (opts.watch) {
    return {
      close() {
        return Promise.all(
          closeHandlers.map(
            (handler) => new Promise((resolve) => handler(resolve)),
          ),
        );
      },
    };
  }
}

export default bundle;
