export default {
  prebundle: {
    transformer: 'esbuild',
    extraDtsDeps: ['equal', 'star-ambient-module'],
  },
};
