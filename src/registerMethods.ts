import { IApi } from './types';

export default (api: IApi) => {
  ['addJSTransformer'].forEach((name) => {
    api.registerMethod({ name });
  });
};
