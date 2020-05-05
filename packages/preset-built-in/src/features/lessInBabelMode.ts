import { IApi } from 'father-types';
import { t } from '@umijs/utils';

function transformImportLess2Css() {
  return {
    name: 'transform-import-less-to-css',
    visitor: {
      ImportDeclaration(path: { node: t.ImportDeclaration }) {
        const re = /\.less$/;
        if (re.test(path.node.source.value)) {
          path.node.source.value = path.node.source.value.replace(re, '.css');
        }
      },
    },
  };
}

export default (api: IApi) => {
  api.describe({
    key: 'plugins',
    config: {
      schema(joi) {
        return joi.object();
      },
    },
  });

  api.modifyConfig(memo => {
    memo.extraBabelPlugins = [
      ...(memo.extraBabelPlugins || []),
      transformImportLess2Css,
    ];
    return memo;
  });
};
