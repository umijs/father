import { mockProcessExit } from 'jest-mock-process';
import path from 'path';
import * as cli from '../src/cli/cli';
import { distToMap } from './utils';

jest.mock('@umijs/utils', () => {
  const originalModule = jest.requireActual('@umijs/utils');

  return {
    __esModule: true,
    ...originalModule,

    // workaround for watch config file change in jest
    // ref:
    //  - https://github.com/facebook/jest/issues/6034
    //  - https://github.com/umijs/umi-next/blob/e46748deab90807c8504dfe11f3bb554f4f27ac3/packages/core/src/config/config.ts#L172
    // TODO: remove this when umi ready
    register: {
      ...originalModule.register,
      getFiles: () => (global.TMP_CASE_CONFIG ? [global.TMP_CASE_CONFIG] : []),
    },
  };
});

const mockExit = mockProcessExit();
const CASES_DIR = path.join(__dirname, 'fixtures/config');

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
});

afterAll(() => {
  delete process.env.APP_ROOT;
  delete process.env.FATHER_CACHE;
  mockExit.mockRestore();
  jest.unmock('@umijs/utils');
});
test('config: cyclic extends', async () => {
  // execute build
  process.env.APP_ROOT = path.join(CASES_DIR, 'config-cyclic-extends');

  // workaround for get config file path
  global.TMP_CASE_CONFIG = path.join(process.env.APP_ROOT, '.fatherrc.ts');

  await cli.run({
    args: { _: ['build'], $0: 'node' },
  });

  // expect process.exit(1) called
  expect(mockExit).toHaveBeenCalledWith(1);

  // restore mock
  jest.unmock('@umijs/utils');
  delete global.TMP_CASE_CONFIG;
});

test('config: nonexistent extends', async () => {
  // execute build
  process.env.APP_ROOT = path.join(CASES_DIR, 'config-nonexistent-extends');

  await cli.run({
    args: { _: ['build'], $0: 'node' },
  });

  // expect process.exit(1) called
  expect(mockExit).toHaveBeenCalledWith(1);
});

test('config: nested extends', async () => {
  // execute build
  process.env.APP_ROOT = path.join(CASES_DIR, 'config-nested-extends');
  await cli.run({
    args: { _: ['build'], $0: 'node' },
  });

  // prepare file map
  const fileMap = distToMap(
    path.join(CASES_DIR, 'config-nested-extends', 'dist'),
  );

  // check result
  require(`${process.env.APP_ROOT}/expect`).default(fileMap);
});
