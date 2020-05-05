#!/usr/bin/env node

const resolveCwd = require('resolve-cwd');

const { name, bin } = require('../package.json');
const localCLI = resolveCwd.silent(`${name}/${bin['father']}`);
if (!process.env.USE_GLOBAL_UMI && localCLI && localCLI !== __filename) {
  const debug = require('@umijs/utils').createDebug('father:cli');
  debug('Using local install of father');
  require(localCLI);
} else {
  require('../lib/cli');
}
