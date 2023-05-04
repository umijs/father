import builder from '../builder';
import { IApi } from '../types';

export default (api: IApi) => {
  api.registerCommand({
    name: 'build',
    description: 'build for production',
    options: `
--no-clean  do not clean all output directories before build
`,
    async fn({ args }) {
      const babelPresetOpts = await api.applyPlugins({
        key: 'modifyBabelPresetOpts',
        initialValue: {},
      });

      const extraBabelPresets = await api.applyPlugins({
        key: 'addExtraBabelPresets',
        initialValue: [],
      });

      const extraBabelPlugins = await api.applyPlugins({
        key: 'addExtraBabelPlugins',
        initialValue: [],
      });

      const chainWebpack = async (memo: any, args: Object) => {
        await api.applyPlugins({
          key: 'chainWebpack',
          type: api.ApplyPluginsType.modify,
          initialValue: memo,
          args,
        });
      };

      await builder({
        userConfig: api.config,
        cwd: api.cwd,
        pkg: api.pkg,
        clean: args.clean,
        buildDependencies: [
          api.pkgPath,
          api.service.configManager!.mainConfigFile,
        ].filter(Boolean) as string[],
        babelPresetOpts,
        extraBabelPresets,
        extraBabelPlugins,
        chainWebpack,
      });
    },
  });
};
