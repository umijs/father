import { IApi } from 'father-types';

export default (api: IApi) => {
  api.describe({
    key: 'umd',
    config: {
      schema(joi) {
        return joi.object({
          type: joi.string(),
        });
      },
    },
  });
};
