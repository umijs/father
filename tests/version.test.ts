import * as cli from '../src/cli/cli';

test(`version`, async () => {
  const spy = jest.spyOn(global.console, 'log');
  await cli.run({
    args: { _: ['version'], $0: 'node' },
  });
  const version = require('../package.json').version;
  expect(global.console.log).toHaveBeenCalledWith(`father@${version}`);
  spy.mockRestore();
});
