"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _lodash = require("lodash");

function stripDotSlashPrefix(path) {
  return path.replace(/^\.\//, '');
}

function _default(entry, opts) {
  let clone = (0, _lodash.cloneDeep)(opts);
  const stripedEntry = stripDotSlashPrefix(entry);

  if (clone.overridesByEntry) {
    Object.keys(clone.overridesByEntry).forEach(key => {
      const stripedKey = stripDotSlashPrefix(key);

      if (stripedKey !== key) {
        clone.overridesByEntry[stripedKey] = clone.overridesByEntry[key];
      }
    });

    if (clone.overridesByEntry[stripedEntry]) {
      clone = (0, _lodash.merge)(clone, clone.overridesByEntry[stripedEntry]);
    }

    delete clone.overridesByEntry;
  }

  return clone;
}