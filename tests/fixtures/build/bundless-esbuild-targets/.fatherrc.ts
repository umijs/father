export default {
  targets: 'es6',
  cjs: {
    transformer: 'esbuild',
    targets: { chrome: 85 },
  },
  esm: {
    transformer: 'esbuild',
    targets: { chrome: 45 },
  },
};
