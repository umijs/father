import { rimraf } from '@umijs/utils';
import { IApi, IFatherConfig } from '../types';
import bundle from './bundle';
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

export default async (opts: {
  userConfig: IFatherConfig;
  cwd: string;
  pkg: IApi['pkg'];
}) => {
  const configProviders = createConfigProviders(opts.userConfig, opts.pkg);
  const outputs = getProviderOutputs(configProviders);

  // clean output directories
  outputs.forEach((output) => {
    rimraf.sync(output);
  });

  // TODO: register config change handler

  if (configProviders.bundle) {
    await bundle({ cwd: opts.cwd, configProvider: configProviders.bundle });
  }

  if (configProviders.bundless.esm) {
    await bundless({
      cwd: opts.cwd,
      configProvider: configProviders.bundless.esm,
    });
  }

  if (configProviders.bundless.cjs) {
    await bundless({
      cwd: opts.cwd,
      configProvider: configProviders.bundless.cjs,
    });
  }
};
