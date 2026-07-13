export default {
  esm: {},
  umd: {
    externals: {
      react: {
        root: 'React',
        commonjs: 'react',
        commonjs2: 'react',
      },
    },
  },
};
