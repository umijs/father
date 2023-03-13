import { IApi } from './types';

export default (api: IApi) => {
  [
    'addJSTransformer',
    'addCSSPreprocessor',
    'addRegularCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
