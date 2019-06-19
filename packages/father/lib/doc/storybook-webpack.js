"use strict";

var _path = require("path");

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const cwd = process.cwd();

const pkg = require((0, _path.join)(cwd, 'package.json'));

module.exports = (baseConfig, env, config) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [{
      loader: require.resolve('ts-loader'),
      options: {
        context: cwd,
        configFile: (0, _path.join)(__dirname, '../../template/tsconfig.json'),
        transpileOnly: true
      }
    }, require.resolve('react-docgen-typescript-loader')]
  });
  config.resolve.extensions.push('.ts', '.tsx');
  config.resolve.alias = _objectSpread({}, config.resolve.alias, {
    [pkg.name]: cwd
  });
  config.module.rules.push({
    test: /\.less$/,
    use: [{
      loader: 'style-loader'
    }, {
      loader: 'css-loader'
    }, {
      loader: 'less-loader',
      options: {
        javascriptEnabled: true
      }
    }]
  });
  config.resolve.extensions.push('.less'); // Resolve

  config.resolve.modules = [...(config.resolve.modules || []), (0, _path.join)(cwd, 'node_modules'), (0, _path.join)(__dirname, '../../node_modules')]; // Remove core-js

  delete config.resolve.alias['core-js'];
  return config;
};