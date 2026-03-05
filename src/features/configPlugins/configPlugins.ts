import { deepmerge } from '@umijs/utils';
import { IApi } from '../../types';
import { getSchemas } from './schema';

export default (api: IApi) => {
  const configDefaults: Record<string, any> = {};

  const schemas = getSchemas();
  for (const key of Object.keys(schemas)) {
    const config: Record<string, any> = {
      schema: schemas[key] || ((joi: any) => joi.any()),
    };
    if (key in configDefaults) {
      config.default = configDefaults[key];
    }
    api.registerPlugins([
      {
        id: `virtual: config-${key}`,
        key: key,
        config,
      },
    ]);
  }

  // support extends config
  const extendsConfig = api.appData.extendsConfig;
  if (extendsConfig) {
    api.modifyConfig((config) => {
      const ConfigManager: any = api.service.configManager!.constructor;

      ConfigManager.validateConfig({
        config: extendsConfig,
        schemas: api.service.configSchemas,
      });
      return deepmerge(extendsConfig, config);
    });
  }
};
