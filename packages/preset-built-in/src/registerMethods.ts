import { IApi } from 'father-types';

export default (api: IApi) => {
  [].forEach(name => {
    api.registerMethod({ name });
  });
};
