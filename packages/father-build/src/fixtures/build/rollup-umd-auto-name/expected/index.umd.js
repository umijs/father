(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.fooBar = factory());
}(this, function () { 'use strict';

  function index () {
    return 'foo';
  }

  return index;

}));
