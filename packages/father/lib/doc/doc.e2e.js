"use strict";

var _path = require("path");

var _child_process = require("child_process");

var _puppeteer = _interopRequireDefault(require("puppeteer"));

var _http = _interopRequireDefault(require("http"));

var _fs = require("fs");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

let port = 12500;
const servers = {};
let browser;
let page;
const fixtures = (0, _path.join)(__dirname, '../fixtures/doc');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

process.env.COMPRESS = 'none';

function buildDoc(_x) {
  return _buildDoc.apply(this, arguments);
}

function _buildDoc() {
  _buildDoc = _asyncToGenerator(function* (cwd) {
    const umiLibPath = (0, _path.join)(__dirname, '../../bin/father.js');
    return new Promise((resolve, reject) => {
      const child = (0, _child_process.fork)(umiLibPath, ['doc', 'build'], {
        cwd,
        env: {
          COMPRESS: 'none'
        }
      });
      child.on('exit', code => {
        if (code === 1) {
          reject(new Error('Doc build failed'));
        } else {
          resolve();
        }
      });
    });
  });
  return _buildDoc.apply(this, arguments);
}

function doc(_x2) {
  return _doc.apply(this, arguments);
}

function _doc() {
  _doc = _asyncToGenerator(function* (name) {
    const cwd = (0, _path.join)(fixtures, name);
    const targetDist = (0, _path.join)(cwd, '.doc');

    if (!(0, _fs.existsSync)(targetDist)) {
      yield buildDoc(cwd);
    }

    return new Promise(resolve => {
      port += 1;
      servers[name] = {
        port
      };
      servers[name].server = _http.default.createServer((request, response) => {
        return require('serve-handler')(request, response, {
          public: targetDist
        });
      });
      servers[name].server.listen(servers[name].port, () => {
        console.log(`[${name}] Running at http://localhost:${servers[name].port}`);
        resolve();
      });
    });
  });
  return _doc.apply(this, arguments);
}

beforeAll(
/*#__PURE__*/
_asyncToGenerator(function* () {
  yield doc('normal');
  yield doc('css-modules');
  yield doc('config-theme');
  yield doc('babel-extra-babel-presets-and-plugins');
  browser = yield _puppeteer.default.launch({
    args: ['--no-sandbox']
  });
}));
beforeEach(
/*#__PURE__*/
_asyncToGenerator(function* () {
  page = yield browser.newPage();
}));
test('normal',
/*#__PURE__*/
_asyncToGenerator(function* () {
  yield page.goto(`http://localhost:${servers['normal'].port}/`, {
    waitUntil: 'networkidle2'
  }); // assert /

  const title = yield page.evaluate(() => document.querySelectorAll('h1')[1].innerHTML);
  expect(title).toEqual('hello'); // navigate to /button

  yield page.evaluate(() => {
    document.querySelectorAll('nav a')[0].click();
  });
  yield delay(300); // assert /button

  const buttonCls = yield page.evaluate(() => document.querySelectorAll('button')[1].getAttribute('class'));
  expect(buttonCls.split(' ').includes('g'));
  expect(buttonCls.split(' ').includes('b'));
  expect(buttonCls.includes('button_button__')).toEqual(true);
  expect(buttonCls.includes('c_p__')).toEqual(true);
}));
test('css-modules',
/*#__PURE__*/
_asyncToGenerator(function* () {
  yield page.goto(`http://localhost:${servers['css-modules'].port}/`, {
    waitUntil: 'networkidle2'
  });
  const buttonCls = yield page.evaluate(() => document.querySelectorAll('button')[1].getAttribute('class'));
  expect(buttonCls.startsWith('index_g__')).toEqual(true);
}));
test('config-theme',
/*#__PURE__*/
_asyncToGenerator(function* () {
  yield page.goto(`http://localhost:${servers['config-theme'].port}/`, {
    waitUntil: 'networkidle2'
  });
  const favicon = yield page.evaluate(() => document.querySelectorAll('link')[0].href);
  expect(favicon).toEqual('https://private-alipayobjects.alipay.com/alipay-rmsdeploy-image/rmsportal/EPkOqxgKmFIsEuPcFBOy.png');
}));
test('babel-extra-babel-presets-and-plugins',
/*#__PURE__*/
_asyncToGenerator(function* () {
  yield page.goto(`http://localhost:${servers['babel-extra-babel-presets-and-plugins'].port}/`, {
    waitUntil: 'networkidle2'
  });
  const title = yield page.evaluate(() => document.querySelector('.foo').innerHTML);
  expect(title).toEqual('p1|p2|p1|p2|haha');
}));
afterAll(() => {
  Object.keys(servers).forEach(name => {
    servers[name].server.close();
  });
  browser.close();
});