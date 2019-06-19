"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
const noEmptyStr = {
  type: 'string',
  minLength: 1
};
var _default = {
  type: 'object',
  additionalProperties: false,
  properties: {
    entry: {
      oneOf: [noEmptyStr, {
        type: 'array',
        items: noEmptyStr
      }]
    },
    file: {
      type: 'string'
    },
    esm: {
      oneOf: [noEmptyStr, {
        type: 'boolean'
      }, {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            pattern: '^(rollup|babel)$'
          },
          file: noEmptyStr,
          mjs: {
            type: 'boolean'
          },
          minify: {
            type: 'boolean'
          },
          importLibToEs: {
            type: 'boolean'
          }
        }
      }]
    },
    cjs: {
      oneOf: [noEmptyStr, {
        type: 'boolean'
      }, {
        type: 'object',
        additionalProperties: false,
        properties: {
          type: {
            type: 'string',
            pattern: '^(rollup|babel)$'
          },
          file: noEmptyStr,
          minify: {
            type: 'boolean'
          }
        }
      }]
    },
    umd: {
      oneOf: [{
        type: 'boolean'
      }, {
        type: 'object',
        additionalProperties: false,
        properties: {
          globals: {
            type: 'object'
          },
          file: noEmptyStr,
          name: noEmptyStr,
          minFile: {
            type: 'boolean'
          }
        }
      }]
    },
    extraBabelPlugins: {
      type: 'array'
    },
    extraBabelPresets: {
      type: 'array'
    },
    extraPostCSSPlugins: {
      type: 'array'
    },
    extraExternals: {
      type: 'array'
    },
    cssModules: {
      oneOf: [{
        type: 'boolean'
      }, {
        type: 'object'
      }]
    },
    extractCSS: {
      type: 'boolean'
    },
    autoprefixer: {
      type: 'object'
    },
    namedExports: {
      type: 'object'
    },
    runtimeHelpers: {
      type: 'boolean'
    },
    overridesByEntry: {
      type: 'object'
    },
    target: noEmptyStr,
    doc: {
      type: 'object'
    },
    replace: {
      type: 'object'
    },
    browserFiles: {
      type: 'array'
    },
    nodeFiles: {
      type: 'array'
    },
    disableTypeCheck: {
      type: 'boolean'
    },
    preCommit: {
      type: 'object',
      additionalProperties: false,
      properties: {
        eslint: {
          type: 'boolean'
        },
        prettier: {
          type: 'boolean'
        }
      }
    }
  }
};
exports.default = _default;