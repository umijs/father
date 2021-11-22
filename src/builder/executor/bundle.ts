import type {
  IFatherBaseConfig,
  IFatherBuildTypes,
  IFatherBundlerConfig,
} from '../../types';

/**
 * declare bundler config
 */
export interface IBundlerConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundlerConfig, 'entry'> {
  type: IFatherBuildTypes.BUNDLE;
  bundler: 'webpack';
  entry: string;
}

export default async (config: IBundlerConfig) => {
  config;
  console.log('[bundle] umd');
};
