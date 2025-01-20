import { IApi } from './types';

export default (api: IApi) => {
  [
    'addJSTransformer',
    'addRegularCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
    'onAllBuildComplete',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
