"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.optionalChaining = void 0;

var _foo$test;

var foo = {};
var optionalChaining = foo === null || foo === void 0 ? void 0 : (_foo$test = foo.test) === null || _foo$test === void 0 ? void 0 : _foo$test.abc;
exports.optionalChaining = optionalChaining;