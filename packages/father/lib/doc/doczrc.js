"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _doczPluginUmiCss = require("docz-plugin-umi-css");

var _path = require("path");

var _fs = require("fs");

var _lodash = require("lodash");

var _getUserConfig = _interopRequireWildcard(require("father-build/lib/getUserConfig"));

var _registerBabel = _interopRequireDefault(require("father-build/lib/registerBabel"));

var _doczPluginReactExternals = _interopRequireDefault(require("./docz-plugin-react-externals"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const cssModuleRegex = /\.module\.css$/;
const lessModuleRegex = /\.module\.less$/;
const cwd = process.cwd();
const localUserConfig = JSON.parse((0, _fs.readFileSync)((0, _path.join)(cwd, '.docz', '.umirc.library.json'), 'utf-8')); // register babel for config files

(0, _registerBabel.default)({
  cwd,
  only: _getUserConfig.CONFIG_FILES
});

const userConfig = _objectSpread({}, localUserConfig, (0, _getUserConfig.default)({
  cwd
}));

if (!userConfig.doc) {
  userConfig.doc = (0, _lodash.merge)(userConfig.doc || {});
}

const isTypescript = (0, _fs.existsSync)((0, _path.join)(cwd, 'tsconfig.json'));

var _default = _objectSpread({
  typescript: isTypescript,
  repository: false,
  theme: require.resolve('docz-theme-umi').replace(/\\/g, '/')
}, userConfig.doc, {
  modifyBabelRc(babelrc, args) {
    if (typeof userConfig.doc.modifyBabelRc === 'function') {
      babelrc = userConfig.doc.modifyBabelRc(babelrc, args);
    } // 需放 class-properties 前面


    babelrc.plugins.unshift([require.resolve('@babel/plugin-proposal-decorators'), {
      legacy: true
    }]); // Support extraBabelPresets and extraBabelPlugins

    babelrc.presets = [...babelrc.presets, ...(userConfig.extraBabelPresets || [])];
    babelrc.plugins = [...babelrc.plugins, ...(userConfig.extraBabelPlugins || [])];
    return babelrc;
  },

  modifyBundlerConfig(config, dev, args) {
    if (userConfig.doc.modifyBundlerConfig) {
      config = userConfig.doc.modifyBundlerConfig(config, dev, args);
    }

    if (!dev) {
      // do not generate doc sourcemap
      config.devtool = false; // support disable minimize via process.env.COMPRESS

      if (process.env.COMPRESS === 'none') {
        config.optimization.minimize = false;
      }
    } // 确保只有一个版本的 docz，否则 theme 会出错，因为 ComponentProvider 的 context 不是同一个


    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias.docz = (0, _path.dirname)(require.resolve('docz/package.json')); // 透传 BIGFISH_VERSION 环境变量

    config.plugins.push(new (require('webpack').DefinePlugin)({
      'process.env.BIGFISH_VERSION': JSON.stringify(process.env.BIGFISH_VERSION)
    })); // fallback resolve 路径

    config.resolve.modules.push((0, _path.join)(__dirname, '../../node_modules'));
    config.resolveLoader.modules.push((0, _path.join)(__dirname, '../../node_modules'));
    return config;
  },

  plugins: [...(userConfig.doc.plugins || []), (0, _doczPluginReactExternals.default)(), ...(userConfig.cssModules ? [// .css
  (0, _doczPluginUmiCss.css)({
    preprocessor: 'postcss',
    ruleOpts: {
      exclude: /node_modules\/.*\.css$/
    },
    cssmodules: true
  }), (0, _doczPluginUmiCss.css)({
    preprocessor: 'postcss',
    ruleOpts: {
      test: /node_modules\/.*\.css$/
    },
    cssmodules: false
  }), // .less
  (0, _doczPluginUmiCss.css)({
    preprocessor: 'less',
    ruleOpts: {
      exclude: /node_modules\/.*\.less$/
    },
    cssmodules: true,
    loaderOpts: {
      javascriptEnabled: true
    }
  }), (0, _doczPluginUmiCss.css)({
    preprocessor: 'less',
    ruleOpts: {
      test: /node_modules\/.*\.less$/
    },
    cssmodules: false,
    loaderOpts: {
      javascriptEnabled: true
    }
  })] : [// .css
  (0, _doczPluginUmiCss.css)({
    preprocessor: 'postcss',
    ruleOpts: {
      exclude: cssModuleRegex
    },
    cssmodules: false
  }), (0, _doczPluginUmiCss.css)({
    preprocessor: 'postcss',
    ruleOpts: {
      test: cssModuleRegex
    },
    cssmodules: true
  }), // .less
  (0, _doczPluginUmiCss.css)({
    preprocessor: 'less',
    ruleOpts: {
      exclude: lessModuleRegex
    },
    cssmodules: false,
    loaderOpts: {
      javascriptEnabled: true
    }
  }), (0, _doczPluginUmiCss.css)({
    preprocessor: 'less',
    ruleOpts: {
      test: lessModuleRegex
    },
    cssmodules: true,
    loaderOpts: {
      javascriptEnabled: true
    }
  })])]
});

exports.default = _default;