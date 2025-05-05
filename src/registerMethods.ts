import { IApi } from './types';

export default (api: IApi) => {
  [
    'addJSTransformer',
    'addRegularCheckup',
    'addJSXSourceCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
    'onAllBuildComplete',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
