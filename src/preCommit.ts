import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { EOL } from 'os';
import signale from 'signale';
import getUserConfig, { CONFIG_FILES } from './getUserConfig';
import registerBabel from './registerBabel';

const HOOK_MARK = '##### CREATED BY FATHER #####';

const cwd = process.cwd();

// register babel for config files
registerBabel({
  cwd,
  only: CONFIG_FILES,
});

const { preCommit: preCommitConfig = {} } = getUserConfig({ cwd });

function getPreCommitTemplate() {
  return [
    '#!/usr/bin/env bash',
    'npx father pre-commit',
    'RESULT=$?',
    '[ $RESULT -ne 0 ] && exit 1',
    'exit 0',
    HOOK_MARK,
  ].join(EOL);
}

export function install() {
  const usePreCommit: boolean = !!Object.keys(preCommitConfig).length;
  const pkgPath = join(cwd, 'package.json');
  const pkg = require(pkgPath);

  const hookPath = join(cwd, '.git/hooks');
  const preCommitHooks = join(hookPath, 'pre-commit');
  const existHooks = existsSync(preCommitHooks);
  const isFatherPreCommit = existHooks && readFileSync(preCommitHooks, 'utf8').includes(HOOK_MARK);

  // Check if exist other hooks
  if (usePreCommit && existHooks && !isFatherPreCommit) {
    signale.warn('Another pre-commit hooks is in using. Father pre-commit hook will not work.');
    return;
  }

  if (usePreCommit && !existHooks) {
    // Create hook path
    if (!existsSync(hookPath)) {
      mkdirSync(hookPath);
    }

    writeFileSync(preCommitHooks, getPreCommitTemplate(), 'utf8');
    pkg.scripts['pre-commit'] = 'father pre-commit';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');

    signale.info('Create pre-commit hook');
  }
}

export function check() {
  // Prettier
  if (preCommitConfig.prettier) {
    
  }

  signale.success('pre-commit success!');
}