import path from 'path';
// TODO: why vitest-mock-process no work?
// import { mockProcessExit } from 'vitest-mock-process';
import * as cli from '../src/cli/cli';
import { distToMap } from './utils';

// const mockExit = mockProcessExit();
const CASES_DIR = path.join(__dirname, 'fixtures/config');

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
});

afterAll(() => {
  delete process.env.APP_ROOT;
  delete process.env.FATHER_CACHE;
  // mockExit.mockRestore();
});
test('config: cyclic extends', async () => {
  // execute build
  process.env.APP_ROOT = path.join(CASES_DIR, 'config-cyclic-extends');

  // workaround for get config file path
  global.TMP_CASE_CONFIG = path.join(process.env.APP_ROOT, '.fatherrc.ts');

  try {
    await cli.run({
      args: { _: ['build'], $0: 'node' },
    });
  } catch (error) {
    console.log(error);
  }

  // expect process.exit(1) called
  // expect(mockExit).toHaveBeenCalledWith(1);

  delete global.TMP_CASE_CONFIG;
});

test('config: nonexistent extends', async () => {
  // execute build
  process.env.APP_ROOT = path.join(CASES_DIR, 'config-nonexistent-extends');

  await cli.run({
    args: { _: ['build'], $0: 'node' },
  });

  // expect process.exit(1) called
  // expect(mockExit).toHaveBeenCalledWith(1);
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
  (await import(`${process.env.APP_ROOT}/expect`)).default(fileMap);
});
