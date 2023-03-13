import {
  addLoader as addBundlessLoader,
  ILoaderItem,
} from '../../builder/bundless/loaders';
import {
  addTransformer as addJSTransformer,
  ITransformerItem,
} from '../../builder/bundless/loaders/javascript';
import {
  addPreprocessor as addCSSPreprocessor,
  IPreprocessorItem,
} from '../../builder/bundless/loaders/css';
import {
  IApi,
  IFatherJSTransformerTypes,
  IFatherCSSPreprocessorTypes,
} from '../../types';

export default async (api: IApi) => {
  // collect all bundless loaders
  const bundlessLoaders: ILoaderItem[] = await api.applyPlugins({
    key: 'addBundlessLoader',
    initialValue: [
      {
        id: 'js-loader',
        test: /((?<!\.d)\.ts|\.(jsx?|tsx))$/,
        loader: require.resolve('../../builder/bundless/loaders/javascript'),
      },
      {
        id: 'css-loader',
        test: /\.(le|sa|sc)ss$/,
        loader: require.resolve('../../builder/bundless/loaders/css'),
      },
    ],
  });

  // register bundless loaders
  bundlessLoaders.forEach((l) => addBundlessLoader(l));

  // collect all bundless js transformers
  const jsTransformers: ITransformerItem[] = await api.applyPlugins({
    key: 'addJSTransformer',
    initialValue: [
      {
        id: IFatherJSTransformerTypes.BABEL,
        transformer: require.resolve(
          '../../builder/bundless/loaders/javascript/babel',
        ),
      },
      {
        id: IFatherJSTransformerTypes.ESBUILD,
        transformer: require.resolve(
          '../../builder/bundless/loaders/javascript/esbuild',
        ),
      },
      {
        id: IFatherJSTransformerTypes.SWC,
        transformer: require.resolve(
          '../../builder/bundless/loaders/javascript/swc',
        ),
      },
    ],
  });

  // register js transformers
  jsTransformers.forEach((t) => addJSTransformer(t));

  const cssPreprocessors: IPreprocessorItem[] = await api.applyPlugins({
    key: 'addCSSPreprocessor',
    initialValue: [
      {
        id: IFatherCSSPreprocessorTypes.LESS,
        preprocessor: require.resolve(
          '../../builder/bundless/loaders/css/less',
        ),
      },
      {
        id: IFatherCSSPreprocessorTypes.SASS,
        preprocessor: require.resolve(
          '../../builder/bundless/loaders/css/sass',
        ),
      },
    ],
  });

  cssPreprocessors.forEach((p) => addCSSPreprocessor(p));
};
