export default {
  umd: {
    externals: {
      externals: 'Externals',
      '@org/externals': 'OrgExternals',
    },
  },
  cjs: {
    alias: {
      alias: 'alias',
      '@org/alias': '@org/alias',
    },
    ignores: ['./src/ignore.ts'],
  },
};
