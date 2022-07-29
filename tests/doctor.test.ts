import { mockProcessExit } from 'jest-mock-process';
import path from 'path';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures/doctor');
const mockExit = mockProcessExit();
const logSpy = jest.spyOn(console, 'log');

afterAll(() => {
  logSpy.mockRestore();
  mockExit.mockRestore();
  delete process.env.APP_ROOT;
});

test('doctor: warn checkups', async () => {
  process.env.APP_ROOT = path.join(CASES_DIR, 'warns');
  await cli.run({
    args: { _: ['doctor'], $0: 'node' },
  });

  // DUP_IN_PEER_DEPS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('peerDependency'),
  );

  // EFFECTS_IN_SIDE_EFFECTS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('sideEffect syntax'),
  );

  // PREFER_BABEL_RUNTIME
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('@babel/runtime'),
  );

  // PREFER_PACK_FILES
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('No `files` field'),
  );

  // PREFER_NO_CSS_MODULES
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('CSS Modules'),
  );
});

test('doctor: error checkups', async () => {
  process.env.APP_ROOT = path.join(CASES_DIR, 'errors');
  await cli.run({
    args: { _: ['doctor'], $0: 'node' },
  });

  // PHANTOM_DEPS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('Source depend on'),
  );

  // EFFECTS_IN_SIDE_EFFECTS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('styles lost'),
  );

  // PACK_FILES_MISSING
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('will not be published'),
  );

  // process.exit(1)
  expect(mockExit).toHaveBeenCalledWith(1);
});

test('doctor: health', async () => {
  process.env.APP_ROOT = path.join(CASES_DIR, 'health');
  await cli.run({
    args: { _: ['doctor'], $0: 'node' },
  });

  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('looks fine'),
  );
});
