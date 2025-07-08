export default {
  umd: {
    externals: {
      react: {
        root: 'React',
        commonjs: 'react',
        commonjs2: 'react-dom',
      },
      'react-dom': {
        root: 'ReactDom',
        commonjs: 'react-dom',
        commonjs2: 'react-dom',
      },
    },
  },
};
