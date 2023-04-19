import { defineConfig } from 'father';

export default defineConfig({
  // cjs: { output: 'dist', ignores: ['src/vueLoader/transformer/*'] },
  // esm: {
  //   input: 'src/vueLoader/transformer',
  //   output: 'dist/vueLoader/transformer',
  //   transformer: 'esbuild',
  // },
  cjs: { output: 'dist' },
});
