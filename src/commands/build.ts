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
      const babelPreset = await api.applyPlugins({
        key: 'addBabelPresets',
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
        babelPreset: babelPreset.length > 0 ? babelPreset : undefined,
        chainWebpack,
      });
    },
  });
};
