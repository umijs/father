export default {
  cjs: {
    output: 'dist',
    ignores: ['src/client/**', '!src/index.ts', '!src/b/**'],
  },
  esm: {
    input: 'src/client',
    output: 'dist/client',
  },
};
