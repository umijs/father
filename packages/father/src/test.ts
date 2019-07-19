import umiTest from 'umi-test';
import signale from 'signale';

module.exports = async function test(args) {
  const passArgs = {
    ...args,
  };

  umiTest(passArgs).catch(e => {
    signale.error(e);
    process.exit(1);
  });
};
