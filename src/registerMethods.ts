import { IApi } from './types';

export default (api: IApi) => {
  [
    'addJSTransformer',
    'addRegularCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
    'addBabelPresets',
    'modifyBabelPresetOpts',
    'chainWebpack',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
