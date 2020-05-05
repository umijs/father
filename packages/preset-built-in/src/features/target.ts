import { IApi } from 'father-types';

export default (api: IApi) => {
  api.describe({
    key: 'target',
    config: {
      default: 'browser',
      schema(joi) {
        return joi.string();
      },
    },
  });
};
