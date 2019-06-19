"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.devOrBuild = devOrBuild;

var _standalone = _interopRequireDefault(require("@storybook/react/standalone"));

var _storybookGenerator = _interopRequireDefault(require("./storybook-generator"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function devOrBuild({
  cwd,
  cmd,
  DOC_PATH
}) {
  const _generator = (0, _storybookGenerator.default)(cwd),
        storybookPath = _generator.storybookPath;

  if (cmd === 'build') {
    return (0, _standalone.default)({
      mode: 'static',
      outputDir: DOC_PATH,
      configDir: storybookPath
    });
  } else {
    // Dev mode
    return (0, _standalone.default)({
      mode: 'dev',
      port: '9001',
      configDir: storybookPath
    });
  }
}