import { deepmerge, resolve } from '@umijs/utils';
import path from 'path';
import { IApi } from './types';

/**
 * parse extends option for config
 */
function parseExtendsConfig(opts: {
  config: Record<string, any>;
  resolvePaths: string[];
  api: IApi;
}) {
  let { config } = opts;
  const { api, resolvePaths } = opts;

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

    delete config.extends;

    // load extends config
    const { config: extendsConfig, files: extendsFiles } =
      ConfigManager.getUserConfig({ configFiles: [absExtendsPath] });

    if (Array.isArray(extendsConfig.presets)) {
      extendsConfig.presets = resolvePathArray(
        extendsConfig.presets,
        path.dirname(absExtendsPath),
      );
    }

    if (Array.isArray(extendsConfig.plugins)) {
      extendsConfig.plugins = resolvePathArray(
        extendsConfig.plugins,
        path.dirname(absExtendsPath),
      );
    }

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

function resolvePathArray(arr: string[], baseDir: string) {
  return arr.map((item) => {
    if (typeof item !== 'string') return item;
    if (path.isAbsolute(item)) return item;

    // Only resolve explicit relative specifiers. Others are treated as npm packages.
    if (/^\.\.?[\/\\]/.test(item)) {
      return resolve.sync(item, {
        basedir: baseDir,
        extensions: ['.js', '.ts'],
      });
    }
    return item;
  });
}

export default (api: IApi) => {
  api.onStart(() => {});

  const extendsPath = api.userConfig.extends;
  let extendsPlugins: string[] = [];
  let extendsPresets: string[] = [];
  if (extendsPath) {
    const { plugins, presets, ...extendsConfig } = parseExtendsConfig({
      api,
      config: { extends: extendsPath },
      resolvePaths: api.service
        .configManager!.getUserConfig()
        .files.map((file) => path.dirname(file)),
    });
    api.appData.extendsConfig = extendsConfig;
    extendsPlugins = plugins;
    extendsPresets = presets;
  }

  return {
    presets: [...(extendsPresets || [])],
    plugins: [
      require.resolve('./registerMethods'),

      // commands
      require.resolve('./commands/dev'),
      require.resolve('./commands/doctor'),
      require.resolve('./commands/build'),
      require.resolve('./commands/changelog'),
      require.resolve('./commands/prebundle'),
      require.resolve('./commands/release'),
      require.resolve('./commands/version'),
      require.resolve('./commands/help'),
      require.resolve('./commands/generators/jest'),
      require.resolve('./commands/generators/commitlint'),
      require.resolve('./commands/generators/eslint'),
      require.resolve('./commands/generators/stylelint'),
      require.resolve('./commands/generators/lint'),

      // features
      require.resolve('./features/configBuilder/configBuilder'),
      require.resolve('./features/configPlugins/configPlugins'),
      require.resolve('./features/depsOnDemand/swc'),

      // extends plugins
      ...(extendsPlugins || []),
    ],
  };
};
