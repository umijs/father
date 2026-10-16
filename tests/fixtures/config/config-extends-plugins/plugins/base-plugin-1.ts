import { IApi } from '../../../../../src/types';

export default (api: IApi) => {
  api.modifyConfig((config) => {
    config.define = {
      ...config.define,
      'process.env.BASE_PLUGIN_1': `"base-plugin-1"`,
    };
    return config;
  });
};
