import path from 'path';
import { deepmerge, resolve } from '@umijs/utils';
import { IApi } from '../../types';
import { getSchemas } from './schema';

/**
 * parse extends option for config
 */
function parseExtendsConfig(opts: {
  config: Record<string, any>;
  resolvePaths?: string[];
  api: IApi;
}) {
  let { config } = opts;
  const {
    api,
    resolvePaths = api.service.configManager!.files.map((f) => path.dirname(f)),
  } = opts;

  if (config.extends) {
    let absExtendsPath = '';
    const ConfigManager: any = api.service.configManager!.constructor;

    // try to resolve extends path
    resolvePaths.some((dir) => {
      try {
        absExtendsPath = resolve.sync(config.extends, {
          basedir: dir,
          extensions: ['.js', '.ts'],
        });
        return true;
      } catch {}
    });

    if (!absExtendsPath) {
      throw new Error(`Cannot find extends config file: ${config.extends}`);
    } else if (api.service.configManager!.files.includes(absExtendsPath)) {
      throw new Error(
        `Cannot extends config circularly for file: ${absExtendsPath}`,
      );
    }

    // load extends config
    const { config: extendsConfig, files: extendsFiles } =
      ConfigManager.getUserConfig({ configFiles: [absExtendsPath] });

    ConfigManager.validateConfig({
      config: extendsConfig,
      schemas: api.service.configSchemas,
    });

    // try to parse nested extends config
    const nestedConfig = parseExtendsConfig({
      config: extendsConfig,
      resolvePaths: [path.dirname(absExtendsPath)],
      api,
    });

    // merge extends config & save related files
    config = deepmerge(nestedConfig, config);
    api.service.configManager!.files.push(...extendsFiles);
  }

  return config;
}

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
  api.modifyConfig((config) => parseExtendsConfig({ config, api }));
};
