export default {
  extends: './.fatherrc.base.ts',
  plugins: ['./plugins/child-plugin-1'],
  esm: {
    transformer: 'esbuild',
  },
};
