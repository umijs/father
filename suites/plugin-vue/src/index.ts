import './requireHook';
import type { IApi } from 'father';
import { logger } from '@umijs/utils';
import { getConfig } from './config/config';

export default (api: IApi) => {
  api.describe({
    key: 'vue',
    config: {
      schema({ zod }) {
        return zod.record(zod.any());
      },
    },
  });

  api.onStart(() => {
    logger.event('start vue compile');
  });

  api.addBabelPresets(async () => {
    const babelPresetOpts = await api.applyPlugins({
      key: 'modifyBabelPresetOpts',
      initialValue: {
        presetEnv: {},
        presetTypeScript: {},
        pluginTransformRuntime: {},
        pluginLockCoreJS: {},
        pluginDynamicImportNode: false,
        pluginAutoCSSModules: true,
      },
    });

    return [require.resolve('@fatherjs/babel-preset-vue'), babelPresetOpts];
  });

  api.chainWebpack((memo, { config }) => {
    getConfig(memo);
    return memo;
  });
};
