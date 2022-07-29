import {
  IApi,
  IFatherJSTransformerTypes,
  IFatherPlatformTypes,
} from '../../types';

export default (api: IApi) => {
  api.addRegularCheckup(({ bundlessConfigs }) => {
    if (
      bundlessConfigs.find(
        (c) =>
          c.transformer === IFatherJSTransformerTypes.BABEL &&
          c.platform === IFatherPlatformTypes.BROWSER,
      ) &&
      !api.pkg.dependencies?.['@babel/runtime']
    ) {
      return {
        type: 'warn',
        problem:
          '@babel/runtime is not installed, the inline runtime helpers will increase dist file size',
        solution:
          'Declare @babel/runtime as a dependency in the package.json file',
      };
    }
  });
};
