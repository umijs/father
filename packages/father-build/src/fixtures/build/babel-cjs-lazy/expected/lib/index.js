"use strict";

function _bar() {
  const data = _interopRequireDefault(require("bar"));

  _bar = function _bar() {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _bar().default)();
