"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _path = require("path");

var _slash = _interopRequireDefault(require("slash2"));

var _getBabelConfig = _interopRequireDefault(require("./getBabelConfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _default(opts) {
  const cwd = opts.cwd,
        only = opts.only;
  const babelConfig = (0, _getBabelConfig.default)({
    target: 'node',
    typescript: true
  });

  require('@babel/register')(_objectSpread({}, babelConfig, {
    extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
    only: only.map(file => (0, _slash.default)((0, _path.join)(cwd, file))),
    babelrc: false,
    cache: false
  }));
}