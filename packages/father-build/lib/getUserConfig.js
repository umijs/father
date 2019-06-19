"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
exports.CONFIG_FILES = void 0;

var _ajv = _interopRequireDefault(require("ajv"));

var _slash = _interopRequireDefault(require("slash2"));

var _path = require("path");

var _signale = _interopRequireDefault(require("signale"));

var _schema = _interopRequireDefault(require("./schema"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function testDefault(obj) {
  return obj.default || obj;
}

const CONFIG_FILES = ['.fatherrc.js', '.fatherrc.jsx', '.fatherrc.ts', '.fatherrc.tsx', '.umirc.library.js', '.umirc.library.jsx', '.umirc.library.ts', '.umirc.library.tsx'];
exports.CONFIG_FILES = CONFIG_FILES;

function _default({
  cwd
}) {
  const configFile = (0, _utils.getExistFile)({
    cwd,
    files: CONFIG_FILES,
    returnRelative: false
  });

  if (configFile) {
    if (configFile.includes('.umirc.library.')) {
      _signale.default.warn(`.umirc.library.js is deprecated, please use .fatherrc.js instead.`);
    }

    const userConfig = testDefault(require(configFile)); // eslint-disable-line

    const ajv = new _ajv.default({
      allErrors: true
    });
    const isValid = ajv.validate(_schema.default, userConfig);

    if (!isValid) {
      const errors = ajv.errors.map(({
        dataPath,
        message
      }, index) => {
        return `${index + 1}. ${dataPath}${dataPath ? ' ' : ''}${message}`;
      });
      throw new Error(`
Invalid options in ${(0, _slash.default)((0, _path.relative)(cwd, configFile))}

${errors.join('\n')}
`.trim());
    }

    return userConfig;
  } else {
    return {};
  }
}