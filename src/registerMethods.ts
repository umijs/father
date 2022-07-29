import { IApi } from './types';

export default (api: IApi) => {
  [
    'addJSTransformer',
    'addRegularCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
