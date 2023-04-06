import * as logger from '@umijs/utils/dist/logger';
import assert from 'assert';
import getGitRepoInfo from 'git-repo-info';
import { join } from 'path';
import rimraf from 'rimraf';
import 'zx/globals';

const pkgs = ['.', 'boilerplate'];
const noNextTagPkgs = ['boilerplate'];

(async () => {
  const { branch } = getGitRepoInfo();
  logger.info(`branch: ${branch}`);
  logger.info(`pkgs: ${pkgs.join(', ')}`);

  // check git status
  logger.event('check git status');
  const isGitClean = (await $`git status --porcelain`).stdout.trim().length;
  assert(!isGitClean, 'git status is not clean');

  // check git remote update
  logger.event('check git remote update');
  await $`git fetch`;
  const gitStatus = (await $`git status --short --branch`).stdout.trim();
  assert(!gitStatus.includes('behind'), `git status is behind remote`);

  // check npm registry
  logger.event('check npm registry');
  const registry = (await $`npm config get registry`).stdout.trim();
  assert(
    registry === 'https://registry.npmjs.org/',
    'npm registry is not https://registry.npmjs.org/',
  );

  // check npm ownership
  logger.event('check npm ownership');
  const whoami = (await $`npm whoami`).stdout.trim();
  await Promise.all(
    ['father', 'create-father'].map(async (pkg) => {
      const owners = (await $`npm owner ls ${pkg}`).stdout
        .trim()
        .split('\n')
        .map((line) => {
          return line.split(' ')[0];
        });
      assert(owners.includes(whoami), `${pkg} is not owned by ${whoami}`);
    }),
  );

  // upgrade umijs deps
  await upgradeUmijsDeps();

  // clean
  logger.event('clean');
  pkgs.forEach((pkg) => {
    logger.info(`clean ${pkg}/dist`);
    rimraf.sync(join(pkg, 'dist'));
  });

  // build packages
  logger.event('build packages');
  await Promise.all(
    pkgs.map(async (pkg) => {
      await $`cd ${pkg} && npm run build`;
    }),
  );

  // bump version
  logger.event('bump version');
  const version = await question(
    `Input release version (current: ${require('../package.json').version}): `,
  );
  await Promise.all(
    pkgs.map(async (pkg) => {
      await $`cd ${pkg} && npm version ${version} --no-git-tag-version`;
    }),
  );
  let tag = 'latest';
  if (
    version.includes('-alpha.') ||
    version.includes('-beta.') ||
    version.includes('-rc.')
  ) {
    tag = 'next';
  }
  if (version.includes('-canary.')) tag = 'canary';

  // commit
  logger.event('commit');
  await $`git commit --all --message "build: release ${version}"`;

  // git tag
  if (tag !== 'canary') {
    logger.event('git tag');
    await $`git tag v${version}`;
  }

  // git push
  logger.event('git push');
  await $`git push origin ${branch} --tags`;

  // npm publish
  logger.event('pnpm publish');
  $.verbose = false;

  // check 2fa config
  let otpArg: string[] = [];
  if (
    (await $`npm profile get "two-factor auth"`).toString().includes('writes')
  ) {
    let code = '';
    do {
      // get otp from user
      code = await question('This operation requires a one-time password: ');
      // generate arg for zx command
      // why use array? https://github.com/google/zx/blob/main/docs/quotes.md
      otpArg = ['--otp', code];
    } while (code.length !== 6);
  }

  await Promise.all(
    pkgs.map(async (pkg) => {
      await $`cd ${pkg} && npm publish --tag ${
        tag === 'next' && noNextTagPkgs.includes(pkg) ? 'latest' : tag
      } ${otpArg}`;
      logger.info(`+ ${pkg}`);
    }),
  );

  // sync tnpm
  logger.event('sync tnpm');
  $.verbose = false;
  await Promise.all(
    pkgs.map(async (pkg) => {
      const { name } = require(path.join(pkg, 'package.json'));
      logger.info(`sync ${name}`);
      await $`tnpm sync ${name}`;
    }),
  );
  $.verbose = true;
})();

async function upgradeUmijsDeps() {
  const pkgPath = join(__dirname, '../package.json');
  const pkg = require(pkgPath);
  const latestVersion: string = (
    await fetch(`https://registry.npmjs.com/umi/latest`).then((res) =>
      res.json(),
    )
  ).version;
  Object.keys(pkg.dependencies).forEach((name) => {
    if (name.startsWith('@umijs/') && !name.endsWith('-webpack-plugin')) {
      pkg.dependencies[name] = `^${latestVersion}`;
    }
  });
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf-8');
  logger.info(`upgrade umijs deps to ^${latestVersion}`);
  await $`pnpm i`;
}
