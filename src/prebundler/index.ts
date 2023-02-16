import { Extractor } from '@microsoft/api-extractor';
import { chalk, winPath } from '@umijs/utils';
// @ts-ignore
import ncc from '@vercel/ncc';
import fs from 'fs';
import path from 'path';
import { getConfig } from './config';
import { getSharedData } from './shared';
import { logger } from '../utils';

export default async (opts: Parameters<typeof getConfig>[0]) => {
  // patch @microsoft/api-extractor before prepare config
  // use require() rather than import(), to avoid jest runner to fail
  // ref: https://github.com/nodejs/node/issues/35889
  require('./patcher');

  const config = getConfig(opts);
  const count = Object.keys(config.deps).length;
  const startTime = Date.now();

  // bundle deps
  for (const dep in config.deps) {
    const { output, pkg, nccConfig } = config.deps[dep];
    const outputDir = path.dirname(output);

    logger.info(
      `Pre-bundle ${chalk.yellow(pkg.name)} to ${chalk.yellow(
        winPath(path.relative(opts.cwd, outputDir)),
      )}`,
    );

    await ncc(dep, nccConfig).then(
      ({
        code,
        assets,
      }: {
        code: string;
        assets: Record<string, { source: string; permissions: number }>;
      }) => {
        // create dist path
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // TODO: dist content validate

        // emit dist file
        fs.writeFileSync(output, code, 'utf-8');

        // emit assets
        Object.entries(assets).forEach(([name, item]) => {
          fs.writeFileSync(path.join(outputDir, name), item.source, {
            encoding: 'utf-8',
            mode: item.permissions,
          });
        });

        // emit package.json
        fs.writeFileSync(
          path.join(outputDir, 'package.json'),
          JSON.stringify({
            name: pkg.name,
            version: pkg.version,
            author: pkg.author,
            authors: pkg.authors,
            contributors: pkg.contributors,
            license: pkg.license,
            _lastModified: new Date().toISOString(),
          }),
          'utf-8',
        );
      },
    );
  }

  // bundle dts
  if (Object.keys(config.dts).length) {
    logger.quietExpect.event(`Generate declaration files...`);

    for (const dts in config.dts) {
      Extractor.invoke(config.dts[dts].maeConfig, {
        localBuild: true,
        showVerboseMessages: false,
      });

      let content = getSharedData<string>(config.dts[dts].output);
      const outputDir = path.dirname(config.dts[dts].output);

      // create dist path
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // process extra targeted externals
      Object.entries(config.dts[dts].externals).forEach(([name, value]) => {
        // only process externals with different targets
        // such as { a: 'b' }, and skip { a: 'a' }
        // because normal externals will be processed by api-extractor
        if (name !== value) {
          content = content.replace(
            new RegExp(`from ("|')${name}["']`, 'g'),
            `from $1${value}$1`,
          );
        }
      });

      // emit dist file
      fs.writeFileSync(config.dts[dts].output, content, 'utf-8');
    }
  }

  if (count) {
    logger.quietExpect.event(
      `Pre-bundled successfully in ${
        Date.now() - startTime
      } ms (${count} deps)`,
    );
  }
};
