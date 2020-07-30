"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var A = /*#__PURE__*/function () {
  function A() {
    (0, _classCallCheck2.default)(this, A);
  }

  (0, _createClass2.default)(A, [{
    key: "foo",
    value: function foo() {}
  }]);
  return A;
}();

new A().foo();
var a = {};
var b = (0, _objectSpread2.default)({}, a);