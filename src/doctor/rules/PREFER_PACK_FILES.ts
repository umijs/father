import type { IApi } from '../../types';

export default (api: IApi) => {
  api.addRegularCheckup(() => {
    if (!api.pkg.files) {
      return {
        type: 'warn',
        problem:
          'No `files` field in the package.json file, all the non-gitignore files will be published',
        solution:
          'Describe the entries that need to be published in `files` field of the package.json file',
      };
    }
  });
};
