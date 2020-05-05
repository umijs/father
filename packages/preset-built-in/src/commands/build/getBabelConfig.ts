import { IConfig } from 'father-types';

export default (opts: {
  config: IConfig;
  isBrowser: boolean;
  moduleType?: string;
}) => {
  return {
    presets: [
      [
        require.resolve('@umijs/babel-preset-umi'),
        {
          typescript: true,
          react: true,
          env: {
            targets: opts.isBrowser
              ? { browsers: ['last 2 versions', 'IE 10'] }
              : { node: 10 },
            modules: opts.moduleType === 'esm' ? false : 'auto',
          },
          transformRuntime: opts.config.runtimeHelpers ? {} : false,
        },
      ],
      ...(opts.config.extraBabelPresets || []),
    ],
    plugins: [...(opts.config.extraBabelPlugins || [])],
  };
};
