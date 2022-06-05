import {
  addLoader as addBundlessLoader,
  ILoaderItem,
} from '../../builder/bundless/loaders';
import { addTransformer as addJSTransformer } from '../../builder/bundless/loaders/javascript';
import babel from '../../builder/bundless/loaders/javascript/babel';
import esbuild from '../../builder/bundless/loaders/javascript/esbuild';
import type { ITransformer } from '../../builder/protocol';
import type { IApi } from '../../types';

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
    ],
  });

  // register bundless loaders
  bundlessLoaders.forEach((l) => addBundlessLoader(l));

  // collect all bundless js transformers
  const jsTransformers: ITransformer[] = await api.applyPlugins({
    key: 'addJSTransformer',
    initialValue: [babel, esbuild],
  });

  // register js transformers
  jsTransformers.forEach((t) => addJSTransformer(t));
};
