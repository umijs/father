import { expect, it } from 'vitest';
import * as cli from '../src/cli/cli';

it(`version`, async () => {
  const spy = vi.spyOn(console, 'log');
  await cli.run({
    args: { _: ['version'], $0: 'node' },
  });
  const version = require('../package.json').version;
  expect(console.log).toHaveBeenCalledWith(`father@${version}`);
  spy.mockRestore();
});
