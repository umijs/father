import umiTest from 'umi-test';
import signale from 'signale';

module.exports = async function test(args) {
  // discard self command
  args._.shift();

  // handle watch alias because it is not in jest args: https://github.com/facebook/jest/blob/v24.9.0/packages/jest-cli/src/cli/args.ts#L690
  if (args.w) {
    args.watch = args.w;
    delete args.w;
  }

  const passArgs = {
    collectCoverageFrom: 'src/**/*',
    ...args,
  };

  umiTest(passArgs).catch(e => {
    signale.error(e);
    process.exit(1);
  });
};
