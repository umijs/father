import type { IFatherConfig } from './types';

type ConfigType = IFatherConfig;

export function defineConfig(config: ConfigType): ConfigType {
  return config;
}
