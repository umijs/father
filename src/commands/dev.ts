import { logger } from '@umijs/utils';
import builder from '../builder';
import { DEV_COMMAND } from '../constants';
import type { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: DEV_COMMAND,
    description: DEV_COMMAND,
    async fn() {
      const buildWatcher = await builder({
        userConfig: api.config,
        cwd: api.cwd,
        pkg: api.pkg,
        watch: true,
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
