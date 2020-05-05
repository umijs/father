import { IApi } from 'father-types';

export default (api: IApi) => {
  api.describe({
    key: 'esm',
    config: {
      schema(joi) {
        return joi.object({
          type: joi.string(),
        });
      },
    },
  });
};
