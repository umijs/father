import { IApi } from '../../../../../src/types';

export default (api: IApi) => {
  api.modifyConfig((config) => {
    config.define = {
      ...config.define,
      'process.env.CHILD_PLUGIN_1': `"child-plugin-1"`,
    };
    return config;
  });
};
