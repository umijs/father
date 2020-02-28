import umiTest from 'umi-test';
import signale from 'signale';
import { join } from 'path';
import { existsSync } from 'fs';

module.exports = async function test(args) {
  const jestConfigFile = join(process.cwd(), 'jest.config.js');
  let userJestConfig: any = {};
  if (existsSync(jestConfigFile)) {
    userJestConfig = require(jestConfigFile); // eslint-disable-line
  }
  const passArgs = userJestConfig.collectCoverageFrom ? {
    ...args,
  } : {
    collectCoverageFrom: 'src/**/*',
    ...args
  };

  umiTest(passArgs).catch(e => {
    signale.error(e);
    process.exit(1);
  });
};
