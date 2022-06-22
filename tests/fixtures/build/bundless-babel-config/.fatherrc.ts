export default {
  esm: {},
  cjs: { transformer: 'babel' },
  extraBabelPlugins: [require.resolve('./plugin')],
};
