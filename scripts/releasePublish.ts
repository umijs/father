import * as logger from '@umijs/utils/dist/logger';
import { join } from 'path';
import 'zx/globals';

const pkgs = ['.', 'boilerplate'];
const noNextTagPkgs = ['boilerplate'];

function getNpmTag(version: string) {
  if (
    version.includes('-alpha.') ||
    version.includes('-beta.') ||
    version.includes('-rc.')
  ) {
    return 'next';
  }
  if (version.includes('-canary.')) return 'canary';
  return 'latest';
}

function getPackageTag(pkg: string, tag: string) {
  return tag === 'next' && noNextTagPkgs.includes(pkg) ? 'latest' : tag;
}

async function isPublished(name: string, version: string) {
  try {
    const publishedVersion = (
      await $`npm view ${`${name}@${version}`} version --registry https://registry.npmjs.org/`
    ).stdout.trim();
    return publishedVersion === version;
  } catch {
    return false;
  }
}

async function publishPackage(pkg: string, tag: string, dryRun: boolean) {
  const pkgJson = require(join(process.cwd(), pkg, 'package.json'));
  if (await isPublished(pkgJson.name, pkgJson.version)) {
    logger.info(`skip ${pkgJson.name}@${pkgJson.version}, already published`);
    return;
  }

  const packageTag = getPackageTag(pkg, tag);
  if (dryRun) {
    logger.info(`[dry-run] cd ${pkg} && npm publish --tag ${packageTag}`);
    return;
  }

  await $`cd ${pkg} && npm publish --tag ${packageTag} --access public --provenance`;
  logger.info(`+ ${pkgJson.name}`);
}

(async () => {
  const version = require('../package.json').version;
  const tag = getNpmTag(version);
  const dryRun =
    argv['dry-run'] || argv.dryRun || process.argv.includes('--dry-run');

  logger.event(`publish packages with npm tag ${tag}`);
  for (const pkg of pkgs) {
    await publishPackage(pkg, tag, dryRun);
  }
})();
