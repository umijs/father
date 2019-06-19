"use strict";

var _path = require("path");

var _child_process = require("child_process");

var _fs = require("fs");

const binPath = (0, _path.join)(__dirname, '../bin/father.js');

function assertDocz(cwd) {
  const absDirPath = (0, _path.join)(cwd, '.doc');
  expect((0, _fs.existsSync)((0, _path.join)(absDirPath))).toEqual(true);
  expect((0, _fs.existsSync)((0, _path.join)(absDirPath, 'index.html'))).toEqual(true);
  expect((0, _fs.existsSync)((0, _path.join)(absDirPath, 'assets.json'))).toEqual(true);
}

describe('father doc build', () => {
  process.env.COMPRESS = 'none';
  process.env.IS_TEST = 'true';

  require('test-build-result')({
    root: (0, _path.join)(__dirname, './fixtures/e2e'),

    build({
      cwd
    }) {
      return new Promise(resolve => {
        const child = (0, _child_process.fork)(binPath, ['doc', 'build'], {
          cwd,
          env: process.env
        });
        child.on('exit', code => {
          expect(code).toEqual(0);
          const child = (0, _child_process.fork)(binPath, ['build', '--esm'], {
            cwd
          });
          child.on('exit', code => {
            expect(code).toEqual(0);
            assertDocz(cwd);
            resolve();
          });
        });
      });
    }

  });
});