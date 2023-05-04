import type { IVueTransformer } from './types';
import { IFatherBundlessTypes } from 'father';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { getConfig } from './config';
import { generateExternal } from './utils';

const FORMAT_MAP = {
  [IFatherBundlessTypes.ESM]: 'es',
  [IFatherBundlessTypes.CJS]: 'cjs',
};

export const transformer: IVueTransformer = async function () {
  try {
    const { mergeConfig, build: viteBuilder } = await import('vite');
    const viteUserConfig = await getConfig(this);

    const format = FORMAT_MAP[this.config.format] ?? 'es';

    const viteConfig = mergeConfig(
      {
        root: this.paths.cwd,
        // TODO 需要确定这里的 mode 是否需要和 father 的 mode 保持一致
        mode: 'development',
        logLevel: 'error',
        build: {
          sourcemap: this.config.sourcemap,
          write: false,
          lib: {
            entry: this.paths.fileAbsPath,
            formats: [format],
          },
          rollupOptions: {
            external: await generateExternal(this.pkg),
            output: {
              entryFileNames: `[name].js`,
            },
          },
        },
        plugins: [
          vue({
            isProduction: false,
          }),
          vueJsx(),
        ],
      },
      viteUserConfig,
    );

    const [{ output }] = (await viteBuilder(viteConfig)) as any[];

    if (output[0].map) {
      return [output[0].code, JSON.stringify(output[0].map)];
    }

    return [output[0].code];
  } catch (e) {
    throw e;
  }
};
