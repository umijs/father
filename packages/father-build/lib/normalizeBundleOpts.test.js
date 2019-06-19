"use strict";

var _normalizeBundleOpts = _interopRequireDefault(require("./normalizeBundleOpts"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

test('normal', () => {
  expect((0, _normalizeBundleOpts.default)('a', {
    umd: {
      name: 'foo'
    },
    overridesByEntry: {
      a: {
        umd: {
          name: 'bar'
        }
      }
    }
  })).toEqual({
    umd: {
      name: 'bar'
    }
  });
});
test('ignore ./ prefix in entry', () => {
  expect((0, _normalizeBundleOpts.default)('./a', {
    umd: {
      name: 'foo'
    },
    overridesByEntry: {
      a: {
        umd: {
          name: 'bar'
        }
      }
    }
  })).toEqual({
    umd: {
      name: 'bar'
    }
  });
});
test('ignore ./ prefix in overridesByEntry', () => {
  expect((0, _normalizeBundleOpts.default)('a', {
    umd: {
      name: 'foo'
    },
    overridesByEntry: {
      './a': {
        umd: {
          name: 'bar'
        }
      }
    }
  })).toEqual({
    umd: {
      name: 'bar'
    }
  });
});
test('deep merge', () => {
  expect((0, _normalizeBundleOpts.default)('a', {
    umd: {
      minFile: false,
      name: 'foo'
    },
    overridesByEntry: {
      a: {
        umd: {
          name: 'bar'
        }
      }
    }
  })).toEqual({
    umd: {
      minFile: false,
      name: 'bar'
    }
  });
});