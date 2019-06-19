"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.devOrBuild = devOrBuild;
exports.deploy = deploy;

var assert = _interopRequireWildcard(require("assert"));

var _chalk = _interopRequireDefault(require("chalk"));

var _fs = require("fs");

var _path = require("path");

var _ghPages = _interopRequireDefault(require("gh-pages"));

var docz = _interopRequireWildcard(require("./docz"));

var storybook = _interopRequireWildcard(require("./storybook"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const DOC_PATH = '.doc';

function devOrBuild(option) {
  const mergedOption = _objectSpread({}, option, {
    DOC_PATH
  });

  if ((option.args || {}).storybook) {
    return storybook.devOrBuild(mergedOption);
  }

  return docz.devOrBuild(mergedOption);
}

function deploy({
  cwd,
  args
}) {
  return new Promise((resolve, reject) => {
    const distDir = (0, _path.join)(cwd, DOC_PATH);
    assert.ok((0, _fs.existsSync)(distDir), `Please run ${_chalk.default.green(`father doc build`)} first`);
    (0, _fs.copyFileSync)((0, _path.join)(distDir, 'index.html'), (0, _path.join)(distDir, '404.html'));

    _ghPages.default.publish(distDir, args, err => {
      if (err) {
        reject(new Error(`Doc deploy failed. ${err.message}`));
      } else {
        resolve();
      }
    });
  });
}