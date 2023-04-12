import type Config from '@umijs/bundler-webpack/compiled/webpack-5-chain';

interface IOpts {
  config: Config;
}

export async function addAssetRules({ config }: IOpts) {
  // bundler-webpack 本身自带的静态资源会触发 vue-loader currently does not support vue rules with oneOf. 需要禁用掉
  config.module.rules.delete('asset');

  const inlineLimit = 10000;

  config.module
    .rule('avif')
    .test(/\.avif$/)
    .type('asset')
    .mimetype('image/avif')
    .parser({
      dataUrlCondition: {
        maxSize: inlineLimit,
      },
    });

  config.module
    .rule('image')
    .test(/\.(bmp|gif|jpg|jpeg|png|svg)$/)
    .type('asset')
    .parser({
      dataUrlCondition: {
        maxSize: inlineLimit,
      },
    });
}
