"use strict";

var _path = require("path");

var _fs = require("fs");

var _mkdirp = _interopRequireDefault(require("mkdirp"));

var _rimraf = _interopRequireDefault(require("rimraf"));

var _build = _interopRequireDefault(require("./build"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('father build', () => {
  require('test-build-result')({
    root: (0, _path.join)(__dirname, './fixtures/build'),

    build({
      cwd
    }) {
      process.chdir(cwd);

      _rimraf.default.sync((0, _path.join)(cwd, 'dist'));

      return (0, _build.default)({
        cwd
      }).then(() => {
        // babel
        ['es', 'lib'].forEach(dir => {
          const absDirPath = (0, _path.join)(cwd, dir);
          const absDistPath = (0, _path.join)(cwd, 'dist');

          if ((0, _fs.existsSync)(absDirPath)) {
            _mkdirp.default.sync(absDistPath);

            (0, _fs.renameSync)(absDirPath, (0, _path.join)(absDistPath, dir));
          }
        }); // lerna

        if ((0, _fs.existsSync)((0, _path.join)(cwd, 'lerna.json'))) {
          _mkdirp.default.sync((0, _path.join)(cwd, 'dist'));

          const pkgs = (0, _fs.readdirSync)((0, _path.join)(cwd, 'packages'));
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = pkgs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              const pkg = _step.value;
              const pkgPath = (0, _path.join)(cwd, 'packages', pkg);
              if (!(0, _fs.statSync)(pkgPath).isDirectory()) continue;
              (0, _fs.renameSync)((0, _path.join)(cwd, 'packages', pkg, 'dist'), (0, _path.join)(cwd, 'dist', pkg));
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
        }
      });
    }

  });
});