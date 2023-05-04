import { IApi } from './types';

export default (api: IApi) => {
  [
    'addRegularCheckup',
    'addSourceCheckup',
    'addImportsCheckup',
    'addBundlessLoader',
    'addJSTransformer',
    'addExtraBabelPresets',
    'addExtraBabelPlugins',

    'modifyBabelPresetOpts',
    'chainWebpack',
  ].forEach((name) => {
    api.registerMethod({ name });
  });
};
