
export default {
  esm: { type: 'rollup' },
  alias: [
    {
      find: /^@\/(.*)/,
      replacement: '../src/$1',
    },
  ],
};
