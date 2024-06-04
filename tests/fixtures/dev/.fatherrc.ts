export default {
  esm: {
    transformer: 'esbuild',
  },
  umd: { entry: { 'src/index': {} } },
};
