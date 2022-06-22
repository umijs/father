export default {
  cjs: {
    output: 'dist',
    ignores: ['src/client/**'],
  },
  esm: {
    input: 'src/client',
    output: 'dist/client',
  },
};
