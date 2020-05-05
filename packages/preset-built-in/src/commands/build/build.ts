import { IApi, IConfig } from 'father-types';
import { Service } from '@umijs/core';
import { deepmerge } from '@umijs/utils';
import { join } from 'path';
import { getPackages, isLerna, getPackageConfig, getTSConfig } from './utils';
import babel from './babel';

export default (api: IApi) => {
  async function build({
    cwd,
    config,
    tsConfig,
  }: {
    cwd: string;
    config: IConfig;
    pkg: typeof Service.prototype.pkg;
    subPkg?: string;
    tsConfig?: object;
  }) {
    const watch = api.args.watch || api.args.w;

    if (config.esm) {
      if (config.esm.type === 'babel') {
        await babel({
          cwd,
          config,
          moduleType: 'esm',
          watch,
          tsConfig,
        });
      }
    }

    if (config.cjs) {
      if (config.cjs.type === 'babel') {
        await babel({
          cwd,
          config,
          moduleType: 'cjs',
          watch,
          tsConfig,
        });
      }
    }

    if (config.umd) {
    }
  }

  api.registerCommand({
    name: 'build',
    async fn() {
      const cwd = api.cwd;
      // 多包
      if (isLerna({ cwd })) {
        const pkgs = api.config.pkgs || getPackages({ cwd, pkg: api.pkg });
        api.logger.info('build lerna packages', pkgs);

        // 允许子包配置使用 es6 或 ts 语法
        api.babelRegister.setOnlyMap({
          key: 'lernaPkgConfig',
          value: pkgs.reduce((memo: string[], pkg: string) => {
            memo.push(join(pkg, '.fatherrc.ts'));
            memo.push(join(pkg, '.fatherrc.js'));
            return memo;
          }, [] as string[]),
        });

        for (const pkg of pkgs) {
          const pkgRoot = join(cwd, pkg);
          await build({
            cwd: pkgRoot,
            config: deepmerge(
              api.config,
              getPackageConfig({
                pkgRoot,
              }),
            ),
            pkg: require(join(pkgRoot, 'package.json')),
            subPkg: pkg,
            tsConfig: deepmerge(
              getTSConfig({ cwd }),
              getTSConfig({ cwd: pkgRoot }),
            ),
          });
        }
      }
      // 单包
      else {
        await build({
          cwd,
          config: api.config,
          pkg: api.pkg,
          tsConfig: getTSConfig({ cwd }),
        });
      }
    },
  });
};
