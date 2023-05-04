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

  api.modifyBabelPresetOpts((memo) => {
    memo.presetTypeScript = {
      // 支持 vue 后缀
      allExtensions: true,
      // 支持 tsx
      isTSX: true,
    };

    // 禁用 react
    memo.presetReact = false;
    return memo;
  });

  api.addExtraBabelPlugins(() => [require.resolve('@vue/babel-plugin-jsx')]);

  api.chainWebpack((memo, { config }) => {
    getConfig(memo);
    return memo;
  });

  api.addBundlessLoader(() => [
    {
      id: 'vue-loader',
      test: /\.vue$/,
      loader: require.resolve('./vueLoader/index'),
    },
  ]);
};
