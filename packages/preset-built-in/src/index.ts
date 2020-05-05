import { IApi } from 'father-types';

export default (api: IApi) => {
  return {
    plugins: [
      // register methods
      require.resolve('./registerMethods'),

      // commands
      require.resolve('./commands/build/build'),

      // features
      require.resolve('./features/cjs'),
      require.resolve('./features/esm'),
      require.resolve('./features/extraBabelPlugins'),
      require.resolve('./features/extraBabelPresets'),
      require.resolve('./features/extraPostCSSPlugins'),
      require.resolve('./features/lessInBabelMode'),
      require.resolve('./features/plugins'),
      require.resolve('./features/presets'),
      require.resolve('./features/target'),
      require.resolve('./features/umd'),
    ],
  };
};
