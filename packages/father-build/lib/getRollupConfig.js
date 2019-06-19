"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _path = require("path");

var _rollupPluginTerser = require("rollup-plugin-terser");

var _rollupPluginBabel = _interopRequireDefault(require("rollup-plugin-babel"));

var _rollupPluginReplace = _interopRequireDefault(require("rollup-plugin-replace"));

var _rollupPluginJson = _interopRequireDefault(require("rollup-plugin-json"));

var _rollupPluginNodeResolve = _interopRequireDefault(require("rollup-plugin-node-resolve"));

var _rollupPluginTypescript = _interopRequireDefault(require("rollup-plugin-typescript2"));

var _rollupPluginCommonjs = _interopRequireDefault(require("rollup-plugin-commonjs"));

var _rollupPluginPostcssUmi = _interopRequireDefault(require("rollup-plugin-postcss-umi"));

var _lodash = require("lodash");

var _tempDir = _interopRequireDefault(require("temp-dir"));

var _autoprefixer = _interopRequireDefault(require("autoprefixer"));

var _lessPluginNpmImport = _interopRequireDefault(require("less-plugin-npm-import"));

var _getBabelConfig = _interopRequireDefault(require("./getBabelConfig"));

var _rollup = _interopRequireDefault(require("@svgr/rollup"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _default(opts) {
  const type = opts.type,
        entry = opts.entry,
        cwd = opts.cwd,
        importLibToEs = opts.importLibToEs,
        bundleOpts = opts.bundleOpts;
  const umd = bundleOpts.umd,
        esm = bundleOpts.esm,
        cjs = bundleOpts.cjs,
        file = bundleOpts.file,
        _bundleOpts$target = bundleOpts.target,
        target = _bundleOpts$target === void 0 ? 'browser' : _bundleOpts$target,
        _bundleOpts$extractCS = bundleOpts.extractCSS,
        extractCSS = _bundleOpts$extractCS === void 0 ? false : _bundleOpts$extractCS,
        modules = bundleOpts.cssModules,
        _bundleOpts$extraPost = bundleOpts.extraPostCSSPlugins,
        extraPostCSSPlugins = _bundleOpts$extraPost === void 0 ? [] : _bundleOpts$extraPost,
        _bundleOpts$extraBabe = bundleOpts.extraBabelPresets,
        extraBabelPresets = _bundleOpts$extraBabe === void 0 ? [] : _bundleOpts$extraBabe,
        _bundleOpts$extraBabe2 = bundleOpts.extraBabelPlugins,
        extraBabelPlugins = _bundleOpts$extraBabe2 === void 0 ? [] : _bundleOpts$extraBabe2,
        autoprefixerOpts = bundleOpts.autoprefixer,
        namedExports = bundleOpts.namedExports,
        runtimeHelpersOpts = bundleOpts.runtimeHelpers,
        replaceOpts = bundleOpts.replace,
        _bundleOpts$extraExte = bundleOpts.extraExternals,
        extraExternals = _bundleOpts$extraExte === void 0 ? [] : _bundleOpts$extraExte;
  const entryExt = (0, _path.extname)(entry);
  const name = file || (0, _path.basename)(entry, entryExt);
  const isTypeScript = entryExt === '.ts' || entryExt === '.tsx';
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.es6', '.es', '.mjs'];
  let pkg = {};

  try {
    pkg = require((0, _path.join)(cwd, 'package.json')); // eslint-disable-line
  } catch (e) {} // cjs 不给浏览器用，所以无需 runtimeHelpers


  const runtimeHelpers = type === 'cjs' ? false : runtimeHelpersOpts;

  const babelOpts = _objectSpread({}, (0, _getBabelConfig.default)({
    target: type === 'esm' ? 'browser' : target,
    typescript: false,
    runtimeHelpers
  }), {
    runtimeHelpers,
    exclude: /\/node_modules\//,
    babelrc: false,
    // ref: https://github.com/rollup/rollup-plugin-babel#usage
    extensions
  });

  if (importLibToEs && type === 'esm') {
    babelOpts.plugins.push(require.resolve('../lib/importLibToEs'));
  }

  babelOpts.presets.push(...extraBabelPresets);
  babelOpts.plugins.push(...extraBabelPlugins); // rollup configs

  const input = (0, _path.join)(cwd, entry);
  const format = type; // ref: https://rollupjs.org/guide/en#external
  // 潜在问题：引用包的子文件时会报 warning，比如 @babel/runtime/helpers/esm/createClass
  // 解决方案：可以用 function 处理

  const external = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {}), ...extraExternals]; // umd 只要 external peerDependencies

  const externalPeerDeps = Object.keys(pkg.peerDependencies || {});

  function getPkgNameByid(id) {
    const splitted = id.split('/'); // @ 和 @tmp 是为了兼容 umi 的逻辑

    if (id.charAt(0) === '@' && splitted[0] !== '@' && splitted[0] !== '@tmp') {
      return splitted.slice(0, 2).join('/');
    } else {
      return id.split('/')[0];
    }
  }

  function testExternal(pkgs, id) {
    return pkgs.includes(getPkgNameByid(id));
  }

  const terserOpts = {
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      warnings: false
    }
  };
  const plugins = [(0, _rollup.default)(), (0, _rollupPluginPostcssUmi.default)({
    extract: extractCSS,
    modules,
    use: [['less', {
      plugins: [new _lessPluginNpmImport.default({
        prefix: '~'
      })],
      javascriptEnabled: true
    }]],
    plugins: [(0, _autoprefixer.default)(autoprefixerOpts), ...extraPostCSSPlugins]
  }), ...(replaceOpts && Object.keys(replaceOpts || {}).length ? [(0, _rollupPluginReplace.default)(replaceOpts)] : []), (0, _rollupPluginNodeResolve.default)({
    mainFields: ['module', 'jsnext:main', 'main'],
    extensions
  }), ...(isTypeScript ? [(0, _rollupPluginTypescript.default)({
    // @see https://github.com/ezolenko/rollup-plugin-typescript2/issues/105
    objectHashIgnoreUnknownHack: true,
    cacheRoot: `${_tempDir.default}/.rollup_plugin_typescript2_cache`,
    // TODO: 支持往上找 tsconfig.json
    // 比如 lerna 的场景不需要每个 package 有个 tsconfig.json
    tsconfig: (0, _path.join)(cwd, 'tsconfig.json'),
    tsconfigDefaults: {
      compilerOptions: {
        // Generate declaration files by default
        declaration: true
      }
    },
    tsconfigOverride: {
      compilerOptions: {
        // Support dynamic import
        target: 'esnext'
      }
    }
  })] : []), (0, _rollupPluginBabel.default)(babelOpts), (0, _rollupPluginJson.default)()];

  switch (type) {
    case 'esm':
      return [{
        input,
        output: {
          format,
          file: (0, _path.join)(cwd, `dist/${esm && esm.file || `${name}.esm`}.js`)
        },
        plugins: [...plugins, ...(esm && esm.minify ? [(0, _rollupPluginTerser.terser)(terserOpts)] : [])],
        external: testExternal.bind(null, external)
      }, ...(esm && esm.mjs ? [{
        input,
        output: {
          format,
          file: (0, _path.join)(cwd, `dist/${esm && esm.file || `${name}`}.mjs`)
        },
        plugins: [...plugins, (0, _rollupPluginReplace.default)({
          'process.env.NODE_ENV': JSON.stringify('production')
        }), (0, _rollupPluginTerser.terser)(terserOpts)],
        external: testExternal.bind(null, externalPeerDeps)
      }] : [])];

    case 'cjs':
      return [{
        input,
        output: {
          format,
          file: (0, _path.join)(cwd, `dist/${cjs && cjs.file || name}.js`)
        },
        plugins: [...plugins, ...(cjs && cjs.minify ? [(0, _rollupPluginTerser.terser)(terserOpts)] : [])],
        external: testExternal.bind(null, external)
      }];

    case 'umd':
      // Add umd related plugins
      plugins.push((0, _rollupPluginCommonjs.default)({
        include: /node_modules/,
        namedExports
      }));
      return [{
        input,
        output: {
          format,
          file: (0, _path.join)(cwd, `dist/${umd && umd.file || `${name}.umd`}.js`),
          globals: umd && umd.globals,
          name: umd && umd.name || pkg.name && (0, _lodash.camelCase)((0, _path.basename)(pkg.name))
        },
        plugins: [...plugins, (0, _rollupPluginReplace.default)({
          'process.env.NODE_ENV': JSON.stringify('development')
        })],
        external: testExternal.bind(null, externalPeerDeps)
      }, ...(umd && umd.minFile === false ? [] : [{
        input,
        output: {
          format,
          file: (0, _path.join)(cwd, `dist/${umd && umd.file || `${name}.umd`}.min.js`),
          globals: umd && umd.globals,
          name: umd && umd.name || pkg.name && (0, _lodash.camelCase)((0, _path.basename)(pkg.name))
        },
        plugins: [...plugins, (0, _rollupPluginReplace.default)({
          'process.env.NODE_ENV': JSON.stringify('production')
        }), (0, _rollupPluginTerser.terser)(terserOpts)],
        external: testExternal.bind(null, externalPeerDeps)
      }])];

    default:
      throw new Error(`Unsupported type ${type}`);
  }
}