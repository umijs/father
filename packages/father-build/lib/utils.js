"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getExistFile = getExistFile;

var _fs = require("fs");

var _path = require("path");

function getExistFile({
  cwd,
  files,
  returnRelative
}) {
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = files[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      const file = _step.value;
      const absFilePath = (0, _path.join)(cwd, file);

      if ((0, _fs.existsSync)(absFilePath)) {
        return returnRelative ? file : absFilePath;
      }
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