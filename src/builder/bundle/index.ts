import type {
  IFatherBaseConfig,
  IFatherBuildTypes,
  IFatherBundleConfig,
} from '../../types';

/**
 * declare bundler config
 */
export interface IBundleConfig
  extends IFatherBaseConfig,
    Omit<IFatherBundleConfig, 'entry'> {
  type: IFatherBuildTypes.BUNDLE;
  bundler: 'webpack';
  entry: string;
}

export default async (config: IBundleConfig) => {
  config;
  console.log('[bundle] umd');
};
