"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _path = require("path");

var _fs = require("fs");

var _vinylFs = _interopRequireDefault(require("vinyl-fs"));

var _signale = _interopRequireDefault(require("signale"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _through = _interopRequireDefault(require("through2"));

var _slash = _interopRequireDefault(require("slash2"));

var chokidar = _interopRequireWildcard(require("chokidar"));

var babel = _interopRequireWildcard(require("@babel/core"));

var _gulpTypescript = _interopRequireDefault(require("gulp-typescript"));

var _gulpIf = _interopRequireDefault(require("gulp-if"));

var _getBabelConfig = _interopRequireDefault(require("./getBabelConfig"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default(_x) {
  return _ref.apply(this, arguments);
}

function _ref() {
  _ref = _asyncToGenerator(function* (opts) {
    const cwd = opts.cwd,
          type = opts.type,
          watch = opts.watch,
          importLibToEs = opts.importLibToEs,
          _opts$bundleOpts = opts.bundleOpts,
          _opts$bundleOpts$targ = _opts$bundleOpts.target,
          target = _opts$bundleOpts$targ === void 0 ? 'browser' : _opts$bundleOpts$targ,
          runtimeHelpers = _opts$bundleOpts.runtimeHelpers,
          _opts$bundleOpts$extr = _opts$bundleOpts.extraBabelPresets,
          extraBabelPresets = _opts$bundleOpts$extr === void 0 ? [] : _opts$bundleOpts$extr,
          _opts$bundleOpts$extr2 = _opts$bundleOpts.extraBabelPlugins,
          extraBabelPlugins = _opts$bundleOpts$extr2 === void 0 ? [] : _opts$bundleOpts$extr2,
          _opts$bundleOpts$brow = _opts$bundleOpts.browserFiles,
          browserFiles = _opts$bundleOpts$brow === void 0 ? [] : _opts$bundleOpts$brow,
          _opts$bundleOpts$node = _opts$bundleOpts.nodeFiles,
          nodeFiles = _opts$bundleOpts$node === void 0 ? [] : _opts$bundleOpts$node,
          disableTypeCheck = _opts$bundleOpts.disableTypeCheck;
    const srcPath = (0, _path.join)(cwd, 'src');
    const targetDir = type === 'esm' ? 'es' : 'lib';
    const targetPath = (0, _path.join)(cwd, targetDir);

    _signale.default.info(`Clean ${targetDir} directory`);

    _rimraf.default.sync(targetPath);

    function transform(opts) {
      const file = opts.file,
            type = opts.type;

      _signale.default.info(`[${type}] Transform: ${(0, _slash.default)(file.path).replace(`${cwd}/`, '')}`);

      const babelOpts = (0, _getBabelConfig.default)({
        target,
        type,
        typescript: true,
        runtimeHelpers,
        filePath: (0, _path.relative)(cwd, file.path),
        browserFiles,
        nodeFiles
      });

      if (importLibToEs && type === 'esm') {
        babelOpts.plugins.push(require.resolve('../lib/importLibToEs'));
      }

      babelOpts.presets.push(...extraBabelPresets);
      babelOpts.plugins.push(...extraBabelPlugins);
      return babel.transform(file.contents, _objectSpread({}, babelOpts, {
        filename: file.path
      })).code;
    }

    function getTSConfig() {
      const tsconfigPath = (0, _path.join)(cwd, 'tsconfig.json');
      const templateTsconfigPath = (0, _path.join)(__dirname, '../template/tsconfig.json');

      if ((0, _fs.existsSync)(tsconfigPath)) {
        return JSON.parse((0, _fs.readFileSync)(tsconfigPath, 'utf-8')).compilerOptions || {};
      } else {
        return JSON.parse((0, _fs.readFileSync)(templateTsconfigPath, 'utf-8')).compilerOptions || {};
      }
    }

    function createStream(src) {
      const tsConfig = getTSConfig();
      const babelTransformRegexp = disableTypeCheck ? /\.(t|j)sx?$/ : /\.jsx?$/;
      return _vinylFs.default.src(src, {
        allowEmpty: true,
        base: srcPath
      }).pipe((0, _gulpIf.default)(f => !disableTypeCheck && /\.tsx?$/.test(f.path), (0, _gulpTypescript.default)(tsConfig))).pipe((0, _gulpIf.default)(f => babelTransformRegexp.test(f.path), _through.default.obj((file, env, cb) => {
        try {
          file.contents = Buffer.from(transform({
            file,
            type
          })); // .jsx -> .js

          file.path = file.path.replace((0, _path.extname)(file.path), '.js');
          cb(null, file);
        } catch (e) {
          _signale.default.error(`Compiled faild: ${file.path}`);

          cb(null);
        }
      }))).pipe(_vinylFs.default.dest(targetPath));
    }

    return new Promise(resolve => {
      createStream([(0, _path.join)(srcPath, '**/*'), `!${(0, _path.join)(srcPath, '**/fixtures/**/*')}`, `!${(0, _path.join)(srcPath, '**/*.mdx')}`, `!${(0, _path.join)(srcPath, '**/*.d.ts')}`, `!${(0, _path.join)(srcPath, '**/*.+(test|e2e|spec).+(js|jsx|ts|tsx)')}`]).on('end', () => {
        if (watch) {
          _signale.default.info('Start watch', srcPath);

          chokidar.watch(srcPath, {
            ignoreInitial: true
          }).on('all', (event, fullPath) => {
            const relPath = fullPath.replace(srcPath, '');

            _signale.default.info(`[${event}] ${(0, _path.join)(srcPath, relPath)}`);

            if (!(0, _fs.existsSync)(fullPath)) return;

            if ((0, _fs.statSync)(fullPath).isFile()) {
              createStream([fullPath]);
            }
          });
        }

        resolve();
      });
    });
  });
  return _ref.apply(this, arguments);
}