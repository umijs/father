export default {
  prebundle: {
    deps: ['test'],
    extraExternals: {
      minimatch: 'minimatch',
      hello: 'world',
    },
    transformer: 'esbuild',
  },
};
