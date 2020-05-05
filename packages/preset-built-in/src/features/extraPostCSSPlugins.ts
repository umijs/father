import { IApi } from 'father-types';

export default (api: IApi) => {
  api.describe({
    key: 'extraPostCSSPlugins',
    config: {
      schema(joi) {
        return joi.array();
      },
    },
  });
};
