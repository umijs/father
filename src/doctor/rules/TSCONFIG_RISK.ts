import { winPath } from '@umijs/utils';
import path from 'path';
import { getTsconfig, getTsconfigPath } from '../../builder/bundless/dts';
import type { IApi } from '../../types';

export default (api: IApi) => {
  api.addRegularCheckup(({ bundlessConfigs }) => {
    if (bundlessConfigs.length) {
      const tsconfigPath = getTsconfigPath(api.cwd);
      // only check when tsconfig.json is in cwd
      const tsconfig =
        tsconfigPath?.includes(winPath(api.cwd)) && getTsconfig(api.cwd);

      if (tsconfig && tsconfig.options.declaration) {
        const inputs = bundlessConfigs.map((c) => c.input);
        const files = tsconfig.fileNames.map((f) =>
          winPath(path.relative(api.cwd, f)),
        );

        if (files.every((f) => inputs.every((i) => !f.startsWith(i)))) {
          return {
            type: 'error',
            problem:
              'No source file included in tsconfig.json, so even if the `declaration` option is enabled, no `.d.ts` dist files will be generated',
            solution:
              "Add source directory to tsconfig.json `include` option, or disable the `declaration` option if you don't need `.d.ts` dist files",
          };
        }
      }
    }
  });
};
