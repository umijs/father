export default {
  prebundle: {
    transformer: 'esbuild',
    output: 'modules',
    deps: ['minimatch'],
  },
};
