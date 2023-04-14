import type { IVueTransformer } from './type';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { dirname } from 'path';

export const transformer: IVueTransformer = async function (content) {
  try {
    const { build: viteBuilder } = await import('vite');

    console.log(dirname(this.paths.fileAbsPath));

    const [{ output }] = (await viteBuilder({
      root: this.paths.cwd,
      mode: 'development',
      resolve: {
        alias: [
          {
            find: '@',
            replacement: this.paths.cwd,
          },
        ],
      },
      build: {
        sourcemap: true,
        write: false,
        lib: {
          entry: this.paths.fileAbsPath,
          formats: ['es'],
        },
        rollupOptions: {
          external: ['vue'],
          output: {
            entryFileNames: `[name].js`,
            globals: {
              vue: 'Vue',
            },
          },
        },
      },
      plugins: [vue(), vueJsx()],
    })) as any[];
    return [output[0].code, JSON.stringify(output[0].map)];
  } catch (e) {
    throw e;
  }
};
