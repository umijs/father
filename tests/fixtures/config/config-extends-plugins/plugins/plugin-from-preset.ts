import { IApi } from '../../../../../src/types';

export default (api: IApi) => {
  api.modifyConfig((config) => {
    config.define = {
      ...config.define,
      'process.env.PLUGIN_FROM_PRESET': `"plugin-from-preset"`,
    };
    return config;
  });
};
