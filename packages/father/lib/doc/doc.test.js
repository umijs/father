"use strict";

var _path = require("path");

var _fs = require("fs");

var _ = require("./");

xdescribe('father doc build', () => {
  process.env.COMPRESS = 'none';

  require('test-build-result')({
    root: (0, _path.join)(__dirname, '../fixtures/doc'),

    build({
      cwd
    }) {
      return (0, _.devOrBuild)({
        cwd,
        cmd: 'build',
        params: [],
        docConfig: {}
      }).then(() => {
        const absDirPath = (0, _path.join)(cwd, '.doc');

        if ((0, _fs.existsSync)(absDirPath)) {
          (0, _fs.renameSync)(absDirPath, (0, _path.join)(cwd, 'dist'));
        } else {
          throw new Error(`.doc not exists`);
        }
      });
    }

  });
});