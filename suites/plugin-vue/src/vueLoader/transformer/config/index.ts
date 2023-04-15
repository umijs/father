import type { InlineConfig as ViteInlineConfig } from 'vite';
import type { IVueLoaderContext } from '../types';
import alias from './alias';
import define from './define';

export async function getConfig(
  applyOpts: IVueLoaderContext,
): Promise<ViteInlineConfig> {
  const { mergeConfig } = await import('vite');

  const transformers = [alias, define];

  return transformers.reduce<ViteInlineConfig>(
    (memo, transformer) =>
      mergeConfig(memo, transformer(applyOpts.config, memo)),
    {},
  );
}
