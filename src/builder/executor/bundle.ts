import type { IFatherBaseConfig, IFatherBundlerConfig } from '../../types';

/**
 * declare bundler config
 */
export interface IBundlerConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundlerConfig, 'entry'> {
  type: 'bundle';
  bundler: 'webpack';
  entry: string;
}

export default async (config: IBundlerConfig) => {
  config;
  console.log('[bundle] umd');
};
