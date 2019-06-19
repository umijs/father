"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.install = install;
exports.check = check;

var _fsExtra = require("fs-extra");

var _path = require("path");

var _chalk = _interopRequireDefault(require("chalk"));

var _child_process = require("child_process");

var _os = require("os");

var _prettier = require("prettier");

var _signale = _interopRequireDefault(require("signale"));

var _stagedGitFiles = _interopRequireDefault(require("staged-git-files"));

var _getUserConfig2 = _interopRequireWildcard(require("father-build/lib/getUserConfig"));

var _registerBabel = _interopRequireDefault(require("father-build/lib/registerBabel"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

const HOOK_MARK = '##### CREATED BY FATHER #####';
const PRETTIER_PARSER = {
  js: 'babel',
  jsx: 'babel',
  ts: 'typescript',
  tsx: 'typescript'
};
const cwd = process.cwd(); // register babel for config files

(0, _registerBabel.default)({
  cwd,
  only: _getUserConfig2.CONFIG_FILES
});

const _getUserConfig = (0, _getUserConfig2.default)({
  cwd
}),
      _getUserConfig$preCom = _getUserConfig.preCommit,
      preCommitConfig = _getUserConfig$preCom === void 0 ? {} : _getUserConfig$preCom;

function getPreCommitTemplate() {
  return ['#!/usr/bin/env bash', 'npx father pre-commit', 'RESULT=$?', '[ $RESULT -ne 0 ] && exit 1', 'exit 0', HOOK_MARK].join(_os.EOL);
}

function install() {
  const usePreCommit = !!Object.keys(preCommitConfig).length;
  const hookPath = (0, _path.join)(cwd, '.git/hooks');
  const preCommitHooks = (0, _path.join)(hookPath, 'pre-commit');
  const existHooks = (0, _fsExtra.existsSync)(preCommitHooks);
  const isFatherPreCommit = existHooks && (0, _fsExtra.readFileSync)(preCommitHooks, 'utf8').includes(HOOK_MARK); // Check if exist other hooks

  if (usePreCommit && existHooks && !isFatherPreCommit) {
    _signale.default.warn('Another pre-commit hooks is in using. Father pre-commit hook will not work.');

    return;
  }

  if (usePreCommit && !existHooks) {
    // Create hook path
    (0, _fsExtra.ensureDirSync)(hookPath);
    (0, _fsExtra.writeFileSync)(preCommitHooks, getPreCommitTemplate(), 'utf8');

    try {
      (0, _fsExtra.chmodSync)(preCommitHooks, '777');
    } catch (e) {
      _signale.default.warn(`chmod ${_chalk.default.cyan(preCommitHooks)} failed: ${e.message}`);
    }

    _signale.default.info('Create pre-commit hook');
  }
}

function runCmd(cmd, args) {
  return new Promise((resolve, reject) => {
    args = args || [];
    const runner = (0, _child_process.spawn)(cmd, args, {
      // keep color
      stdio: 'inherit'
    });
    runner.on('close', code => {
      if (code) {
        _signale.default.error(`Error on execution: ${cmd} ${(args || []).join(' ')}`);

        reject(code);
        return;
      }

      resolve();
    });
  });
}

function getPrettierConfig() {
  const prettierrcPath = (0, _path.join)(cwd, '.prettierrc');

  if ((0, _fsExtra.existsSync)(prettierrcPath)) {
    return JSON.parse((0, _fsExtra.readFileSync)(prettierrcPath, 'utf-8')) || {};
  } else {
    const templateConfig = require('@umijs/fabric/dist/prettier');

    return templateConfig;
  }
}

function getEsLintConfig() {
  const lintPath = (0, _path.join)(cwd, '.eslintrc.js');

  const templateLintPath = require.resolve('@umijs/fabric/dist/eslint');

  if ((0, _fsExtra.existsSync)(lintPath)) {
    return lintPath;
  } else {
    return templateLintPath;
  }
}

function check() {
  return _check.apply(this, arguments);
}

function _check() {
  _check = _asyncToGenerator(function* () {
    const list = (yield (0, _stagedGitFiles.default)()).map(file => file.filename).filter(filename => /^(src|tests)/.test(filename)).filter(filename => /\.(ts|js|tsx|jsx)$/.test(filename)) // Only keep exist files
    .map(filename => {
      const filePath = (0, _path.join)(cwd, filename);
      return (0, _fsExtra.existsSync)(filePath) ? filePath : null;
    }).filter(filePath => filePath);

    if (!list.length) {
      return;
    } // Prettier


    if (preCommitConfig.prettier) {
      const prettierConfig = getPrettierConfig();
      list.forEach(filePath => {
        if ((0, _fsExtra.existsSync)(filePath)) {
          const ext = (0, _path.extname)(filePath).replace(/^\./, '');
          const text = (0, _fsExtra.readFileSync)(filePath, 'utf8');
          const formatText = (0, _prettier.format)(text, _objectSpread({
            parser: PRETTIER_PARSER[ext]
          }, prettierConfig));
          (0, _fsExtra.writeFileSync)(filePath, formatText, 'utf8');
        }
      });

      _signale.default.success(`${_chalk.default.cyan('prettier')} success!`);
    } // eslint


    if (preCommitConfig.eslint) {
      const eslintConfig = getEsLintConfig();

      const eslintBin = require.resolve('eslint/bin/eslint');

      const args = [eslintBin, '-c', eslintConfig, ...list, '--fix'];

      try {
        yield runCmd('node', args);
      } catch (code) {
        process.exit(code);
      }

      _signale.default.success(`${_chalk.default.cyan('eslint')} success!`);
    }

    yield runCmd('git', ['add', ...list]);
  });
  return _check.apply(this, arguments);
}