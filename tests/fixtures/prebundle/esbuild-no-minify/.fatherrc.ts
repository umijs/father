export default {
  prebundle: {
    transformer: 'esbuild',
    deps: {
      rimraf: { minify: false },
    },
  },
};
