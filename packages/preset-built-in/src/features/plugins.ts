import { IApi } from 'father-types';

export default (api: IApi) => {
  api.describe({
    key: 'extraBabelPlugins',
    config: {
      schema(joi) {
        return joi.array().items(joi.string());
      },
    },
  });
};
