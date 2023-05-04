import builder from '../builder';
import { DEV_COMMAND } from '../constants';
import type { IApi } from '../types';
import { logger } from '../utils';

export default (api: IApi) => {
  api.registerCommand({
    name: DEV_COMMAND,
    description: 'start incremental build in watch mode',
    async fn() {
      const babelPresetOpts = await api.applyPlugins({
        key: 'modifyBabelPresetOpts',
        initialValue: {},
      });

      const extraBabelPresets = await api.applyPlugins({
        key: 'addExtraBabelPresets',
        initialValue: [],
      });

      const extraBabelPlugins = await api.applyPlugins({
        key: 'addExtraBabelPlugins',
        initialValue: [],
      });

      const chainWebpack = async (memo: any, args: Object) => {
        await api.applyPlugins({
          key: 'chainWebpack',
          type: api.ApplyPluginsType.modify,
          initialValue: memo,
          args,
        });
      };

      const buildWatcher = await builder({
        userConfig: api.config,
        cwd: api.cwd,
        pkg: api.pkg,
        watch: true,
        babelPresetOpts,
        chainWebpack,
        extraBabelPresets,
        extraBabelPlugins,
      });

      // handle config change
      const closeConfigWatcher: any = api.service.configManager!.watch({
        schemas: api.service.configSchemas,
        onChangeTypes: api.service.configOnChanges,
        async onChange() {
          logger.wait('Config changed, restarting build...');

          // close watchers
          buildWatcher.close();
          closeConfigWatcher();

          // notify cli.ts to restart
          process.emit('message', { type: 'RESTART' }, DEV_COMMAND);
        },
      });
    },
  });
};
