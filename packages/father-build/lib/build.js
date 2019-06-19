"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getBundleOpts = getBundleOpts;
exports.build = build;
exports.buildForLerna = buildForLerna;
exports.default = _default;

var _fs = require("fs");

var _path = require("path");

var _rimraf = _interopRequireDefault(require("rimraf"));

var assert = _interopRequireWildcard(require("assert"));

var _lodash = require("lodash");

var _signale = _interopRequireDefault(require("signale"));

var _chalk = _interopRequireDefault(require("chalk"));

var _babel = _interopRequireDefault(require("./babel"));

var _rollup = _interopRequireDefault(require("./rollup"));

var _registerBabel = _interopRequireDefault(require("./registerBabel"));

var _utils = require("./utils");

var _getUserConfig = _interopRequireWildcard(require("./getUserConfig"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function getBundleOpts(opts) {
  const cwd = opts.cwd,
        _opts$buildArgs = opts.buildArgs,
        buildArgs = _opts$buildArgs === void 0 ? {} : _opts$buildArgs;
  const entry = (0, _utils.getExistFile)({
    cwd,
    files: ['src/index.tsx', 'src/index.ts', 'src/index.jsx', 'src/index.js'],
    returnRelative: true
  });
  const userConfig = (0, _getUserConfig.default)({
    cwd
  });
  const bundleOpts = (0, _lodash.merge)({
    entry
  }, userConfig, buildArgs); // Support config esm: 'rollup' and cjs: 'rollup'

  if (typeof bundleOpts.esm === 'string') {
    bundleOpts.esm = {
      type: bundleOpts.esm
    };
  }

  if (typeof bundleOpts.cjs === 'string') {
    bundleOpts.cjs = {
      type: bundleOpts.cjs
    };
  }

  return bundleOpts;
}

function validateBundleOpts(bundleOpts, {
  cwd
}) {
  if (bundleOpts.runtimeHelpers) {
    const pkgPath = (0, _path.join)(cwd, 'package.json');
    assert.ok((0, _fs.existsSync)(pkgPath), `@babel/runtime dependency is required to use runtimeHelpers`);
    const pkg = JSON.parse((0, _fs.readFileSync)(pkgPath, 'utf-8'));
    assert.ok((pkg.dependencies || {})['@babel/runtime'], `@babel/runtime dependency is required to use runtimeHelpers`);
  }

  if (!bundleOpts.esm && !bundleOpts.cjs && !bundleOpts.umd) {
    throw new Error(`
None format of ${_chalk.default.cyan('cjs | esm | umd')} is configured, checkout https://github.com/umijs/father for usage details.
`.trim());
  }

  if (bundleOpts.entry) {
    const tsConfigPath = (0, _path.join)(cwd, 'tsconfig.json');

    if (!(0, _fs.existsSync)(tsConfigPath) && (Array.isArray(bundleOpts.entry) && bundleOpts.entry.some(isTypescriptFile) || !Array.isArray(bundleOpts.entry) && isTypescriptFile(bundleOpts.entry))) {
      _signale.default.info(`Project using ${_chalk.default.cyan('typescript')} but tsconfig.json not exists. Use default config.`);
    }
  }
}

function isTypescriptFile(filePath) {
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
}

function build(_x) {
  return _build.apply(this, arguments);
}

function _build() {
  _build = _asyncToGenerator(function* (opts, extraOpts = {}) {
    const cwd = opts.cwd,
          watch = opts.watch;
    const pkg = extraOpts.pkg; // register babel for config files

    (0, _registerBabel.default)({
      cwd,
      only: _getUserConfig.CONFIG_FILES
    });

    function log(msg) {
      _signale.default.info(`${pkg ? `[${pkg}] ` : ''}${msg}`);
    } // Get user config


    const bundleOpts = getBundleOpts(opts);
    validateBundleOpts(bundleOpts, {
      cwd
    }); // Clean dist

    log(`Clean dist directory`);

    _rimraf.default.sync((0, _path.join)(cwd, 'dist')); // Build umd


    if (bundleOpts.umd) {
      log(`Build umd`);
      yield (0, _rollup.default)({
        cwd,
        type: 'umd',
        entry: bundleOpts.entry,
        watch,
        bundleOpts
      });
    } // Build cjs


    if (bundleOpts.cjs) {
      const cjs = bundleOpts.cjs;
      log(`Build cjs with ${cjs.type}`);

      if (cjs.type === 'babel') {
        yield (0, _babel.default)({
          cwd,
          watch,
          type: 'cjs',
          bundleOpts
        });
      } else {
        yield (0, _rollup.default)({
          cwd,
          type: 'cjs',
          entry: bundleOpts.entry,
          watch,
          bundleOpts
        });
      }
    } // Build esm


    if (bundleOpts.esm) {
      const esm = bundleOpts.esm;
      log(`Build esm with ${esm.type}`);
      const importLibToEs = esm && esm.importLibToEs;

      if (esm && esm.type === 'babel') {
        yield (0, _babel.default)({
          cwd,
          watch,
          type: 'esm',
          importLibToEs,
          bundleOpts
        });
      } else {
        yield (0, _rollup.default)({
          cwd,
          type: 'esm',
          entry: bundleOpts.entry,
          importLibToEs,
          watch,
          bundleOpts
        });
      }
    }
  });
  return _build.apply(this, arguments);
}

function buildForLerna(_x2) {
  return _buildForLerna.apply(this, arguments);
}

function _buildForLerna() {
  _buildForLerna = _asyncToGenerator(function* (opts) {
    const cwd = opts.cwd; // register babel for config files

    (0, _registerBabel.default)({
      cwd,
      only: _getUserConfig.CONFIG_FILES
    });
    const userConfig = (0, _getUserConfig.default)({
      cwd
    });
    const pkgs = (0, _fs.readdirSync)((0, _path.join)(opts.cwd, 'packages'));
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = pkgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        const pkg = _step.value;
        if (process.env.PACKAGE && pkg !== process.env.PACKAGE) continue; // build error when .DS_Store includes in packages root

        const pkgPath = (0, _path.join)(opts.cwd, 'packages', pkg);
        if (!(0, _fs.statSync)(pkgPath).isDirectory()) continue;
        assert.ok((0, _fs.existsSync)((0, _path.join)(pkgPath, 'package.json')), `package.json not found in packages/${pkg}`);
        process.chdir(pkgPath);
        yield build(_objectSpread({}, opts, {
          buildArgs: (0, _lodash.merge)(opts.buildArgs, userConfig),
          cwd: pkgPath
        }), {
          pkg
        });
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });
  return _buildForLerna.apply(this, arguments);
}

function _default(_x3) {
  return _ref.apply(this, arguments);
}

function _ref() {
  _ref = _asyncToGenerator(function* (opts) {
    const useLerna = (0, _fs.existsSync)((0, _path.join)(opts.cwd, 'lerna.json'));

    if (useLerna && process.env.LERNA !== 'none') {
      yield buildForLerna(opts);
    } else {
      yield build(opts);
    }
  });
  return _ref.apply(this, arguments);
}