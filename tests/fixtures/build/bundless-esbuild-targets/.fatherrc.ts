export default {
  targets: { chrome: 70 },
  cjs: {
    transformer: 'esbuild',
    targets: { chrome: 85 },
  },
  esm: {
    transformer: 'esbuild',
    targets: { chrome: 54 },
  },
};
