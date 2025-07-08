export default {
  umd: {
    externals: {
      react: {
        root: 'React',
        commonjs: 'react',
      },
      'react-dom': {
        root: 'ReactDom',
        commonjs: 'react-dom',
      },
    },
  },
};
