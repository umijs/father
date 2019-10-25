import { ensureDirSync, existsSync, readFileSync, writeFileSync, chmodSync } from 'fs-extra';
import { join, extname } from 'path';
import chalk from 'chalk';
import { spawn } from 'child_process';
import { EOL } from 'os';
import { format } from 'prettier';
import signale from 'signale';
import sgf from 'staged-git-files';
import getUserConfig, { CONFIG_FILES } from 'father-build/lib/getUserConfig';
import registerBabel from 'father-build/lib/registerBabel';

const HOOK_MARK = '##### CREATED BY FATHER #####';
const PRETTIER_PARSER = {
  js: 'babel',
  jsx: 'babel',
  ts: 'typescript',
  tsx: 'typescript',
};

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
    ensureDirSync(hookPath);

    writeFileSync(preCommitHooks, getPreCommitTemplate(), 'utf8');
    try {
      chmodSync(preCommitHooks, '777');
    } catch (e) {
      signale.warn(`chmod ${chalk.cyan(preCommitHooks)} failed: ${e.message}`);
    }

    signale.info('Create pre-commit hook');
  }
}

function runCmd(cmd: string, args: string[]) {
  return new Promise((resolve, reject) => {
    args = args || [];
    const runner = spawn(cmd, args, {
      // keep color
      stdio: 'inherit',
    });
    runner.on('close', code => {
      if (code) {
        signale.error(`Error on execution: ${cmd} ${(args || []).join(' ')}`);
        reject(code);
        return;
      }
      resolve();
    });
  });
}

function getPrettierConfig() {
  const prettierrcPath = join(cwd, '.prettierrc');

  if (existsSync(prettierrcPath)) {
    return JSON.parse(readFileSync(prettierrcPath, 'utf-8')) || {};
  } else {
    const templateConfig = require('@umijs/fabric/dist/prettier');
    return templateConfig;
  }
}

function getEsLintConfig() {
  const lintPath = join(cwd, '.eslintrc.js');
  const templateLintPath = require.resolve('@umijs/fabric/dist/eslint');

  if (existsSync(lintPath)) {
    return lintPath;
  } else {
    return templateLintPath;
  }
}

export async function check() {
  const list: string[] = (await sgf())
    .map((file: { filename: string }) => file.filename)
    .filter((filename: string) => /^(src|tests|examples)/.test(filename))
    .filter((filename: string) => /\.(ts|js|tsx|jsx)$/.test(filename))

    // Only keep exist files
    .map((filename: string) => {
      const filePath = join(cwd, filename);
      return existsSync(filePath) ? filePath : null;
    })
    .filter((filePath: string | null) => filePath);

  if (!list.length) {
    return;
  }

  // Prettier
  if (preCommitConfig.prettier) {
    const prettierConfig = getPrettierConfig();

    list.forEach(filePath => {
      if (existsSync(filePath)) {
        const ext = extname(filePath).replace(/^\./, '');
        const text = readFileSync(filePath, 'utf8');
        const formatText = format(text, {
          parser: PRETTIER_PARSER[ext],
          ...prettierConfig,
        });

        writeFileSync(filePath, formatText, 'utf8');
      }
    });

    signale.success(`${chalk.cyan('prettier')} success!`);
  }

  // eslint
  if (preCommitConfig.eslint) {
    const eslintConfig = getEsLintConfig();
    const eslintBin = require.resolve('eslint/bin/eslint');
    const args = [eslintBin, '-c', eslintConfig, ...list, '--fix'];

    try {
      await runCmd('node', args);
    } catch (code) {
      process.exit(code);
    }

    signale.success(`${chalk.cyan('eslint')} success!`);
  }

  await runCmd('git', ['add', ...list]);
}
