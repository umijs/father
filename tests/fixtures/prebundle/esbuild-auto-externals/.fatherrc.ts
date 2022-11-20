export default {
  prebundle: {
    transformer: 'esbuild',
    deps: ['test', 'other'],
  },
};
