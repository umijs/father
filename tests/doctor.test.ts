import { mockProcessExit } from 'jest-mock-process';
import path from 'path';
import * as cli from '../src/cli/cli';

const CASES_DIR = path.join(__dirname, 'fixtures/doctor');
const mockExit = mockProcessExit();
const logSpy = jest.spyOn(console, 'log');

/**
 * jest will intercept ERR_REQUIRE_ESM to show transformer hint
 * so we need to mock esm module to throw real error
 */
jest.mock('./fixtures/doctor/errors/node_modules/esm/index.js', () => {
  throw new (class extends Error {
    code = 'ERR_REQUIRE_ESM';
  })();
});

afterAll(() => {
  logSpy.mockRestore();
  mockExit.mockRestore();
  delete process.env.APP_ROOT;
  jest.unmock('./fixtures/doctor/errors/node_modules/esm/index.js');
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

  // PREFER_PEER_DEPS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('multi-instance risk'),
  );
});

test('doctor: error checkups', async () => {
  process.env.APP_ROOT = path.join(CASES_DIR, 'errors');
  await cli.run({
    args: { _: ['doctor'], $0: 'node' },
  });

  // PHANTOM_DEPS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('Source depends on'),
  );

  // PHANTOM_DEPS no standard library
  expect(console.log).toHaveBeenCalledWith(
    expect.not.stringContaining('child_process'),
  );

  // EFFECTS_IN_SIDE_EFFECTS
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('styles lost'),
  );

  // PACK_FILES_MISSING
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('will not be published'),
  );

  // CASE_SENSITIVE_PATHS
  // why only win32 and drawin?
  // because Windows and macOS are case-insensitive by default
  if (['win32', 'drawin'].includes(process.platform)) {
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('the corresponding path'),
    );
  }

  // TSCONFIG_RISK
  expect(console.log).toHaveBeenCalledWith(
    expect.stringContaining('No source file included in tsconfig.json'),
  );

  // CJS_IMPORT_PURE_ESM
  // expect(console.log).toHaveBeenCalledWith(
  //   expect.stringContaining('ERR_REQUIRE_ESM'),
  // );

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
