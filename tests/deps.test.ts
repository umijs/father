import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import process from 'process';
import * as cli from '../src/cli/cli';
import { GeneratorHelper } from '../src/commands/generators/utils';

jest.mock('@umijs/utils', () => {
  const originalModule = jest.requireActual('@umijs/utils');

  return {
    __esModule: true,
    ...originalModule,
    installWithNpmClient: jest.fn(),
    resolve: {
      ...originalModule.resolve,
      sync: (id, opts) => {
        if (id === '@swc/core') {
          throw new Error('not resolve');
        }

        return originalModule.resolve.sync(id, opts);
      },
    },
  };
});

const mockInstall = jest.fn();
jest
  .spyOn(GeneratorHelper.prototype, 'installDeps')
  .mockImplementation(mockInstall);

beforeAll(() => {
  process.env.FATHER_CACHE = 'none';
});
afterAll(() => {
  delete process.env.APP_ROOT;
  delete process.env.FATHER_CACHE;
  jest.unmock('@umijs/utils');
});

const CASES_DIR = path.join(__dirname, 'fixtures/deps');

const getPkg = (caseDir: string) =>
  JSON.parse(readFileSync(path.join(caseDir, 'package.json'), 'utf-8'));

test('depsOnDemand: swc', async () => {
  const caseDir = path.join(CASES_DIR, 'swc');
  const resetPkg = () =>
    writeFileSync(path.join(caseDir, 'package.json'), '{}\n');

  const NODE_ENV = 'production';
  process.env.NODE_ENV = NODE_ENV;

  process.env.APP_ROOT = caseDir;

  // reset swc deps
  resetPkg();
  expect(getPkg(caseDir)['devDependencies']?.['@swc/core']).toBeUndefined();

  await cli.run({
    args: { _: ['build'], $0: 'node' },
  });

  expect(process.env.NODE_ENV).toBe(NODE_ENV);
  expect(mockInstall).toBeCalledWith();
  expect(getPkg(caseDir)).not.toBeUndefined();
  resetPkg();
});
