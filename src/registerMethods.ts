import { IApi } from './types';

export default (api: IApi) => {
  [
    'addRegularCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
    'addBabelPresets',
    'addBundlessLoader',
    'addJSTransformer',

    'modifyBabelPresetOpts',
    'chainWebpack',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
