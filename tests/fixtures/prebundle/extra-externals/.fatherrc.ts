export default {
  prebundle: {
    deps: ['test'],
    extraExternals: {
      minimatch: 'minimatch',
    },
  },
};
