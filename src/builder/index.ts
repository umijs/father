import { IFatherConfig } from '../types';
import bundle from './bundle';
import bundless from './bundless';
import { createConfigProviders } from './config';

export default async (opts: { userConfig: IFatherConfig; cwd: string }) => {
  const configProviders = createConfigProviders(opts.userConfig, opts);

  // TODO: register config change handler

  if (configProviders.bundle) {
    await bundle({ cwd: opts.cwd, configProvider: configProviders.bundle });
  }

  if (configProviders.bundless) {
    await bundless({ cwd: opts.cwd, configProvider: configProviders.bundless });
  }
};
