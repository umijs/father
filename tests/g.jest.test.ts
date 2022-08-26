import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import * as cli from '../src/cli/cli';
import { GeneratorHelper } from '../src/commands/generators/utils';

let useRTL = false;
jest.doMock('../src/commands/generators/utils', () => {
  const originalModule = jest.requireActual('../src/commands/generators/utils');
  return {
    __esModule: true,
    ...originalModule,
    promptsExitWhenCancel: jest.fn(() => ({ useRTL })),
  };
});

const mockInstall = jest.fn();
jest
  .spyOn(GeneratorHelper.prototype, 'installDeps')
  .mockImplementation(mockInstall);

const CASES_DIR = path.join(__dirname, 'fixtures/generator');
describe('jest generator', function () {
  process.env.APP_ROOT = path.join(CASES_DIR);
  const jestConfPath = path.join(CASES_DIR, 'jest.config.ts');
  const jestSetupPath = path.join(CASES_DIR, 'jest-setup.ts');
  afterEach(() => {
    [jestConfPath, jestSetupPath].forEach((path) => {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    });
    writeFileSync(path.join(CASES_DIR, 'package.json'), '{}');
  });

  test('g jest', async () => {
    await cli.run({
      args: { _: ['g', 'jest'], $0: 'node' },
    });

    const pkg = JSON.parse(
      readFileSync(path.join(CASES_DIR, 'package.json'), 'utf-8'),
    );

    expect(existsSync(jestConfPath)).toBeTruthy();
    expect(pkg['scripts']).toMatchObject({ test: 'jest' });
    expect(pkg['devDependencies']).toMatchObject({
      jest: '^27',
      '@types/jest': '^27',
      typescript: '^4',
      'ts-node': '^10',
      '@umijs/test': '^4',
    });
    expect(mockInstall).toBeCalled();
  });

  test('g jest with RTL', async () => {
    useRTL = true;

    await cli.run({
      args: { _: ['g', 'jest'], $0: 'node' },
    });

    const pkg = JSON.parse(
      readFileSync(path.join(CASES_DIR, 'package.json'), 'utf-8'),
    );

    expect(existsSync(jestSetupPath)).toBeTruthy();
    expect(pkg['scripts']).toMatchObject({ test: 'jest' });
    expect(pkg['devDependencies']).toMatchObject({
      '@testing-library/react': '^13',
      '@testing-library/jest-dom': '^5.16.4',
      '@types/testing-library__jest-dom': '^5.14.5',
    });
    expect(mockInstall).toBeCalled();
  });

  test('warning when jest config exists', async () => {
    writeFileSync(jestConfPath, '{}');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await cli.run({
      args: { _: ['g', 'jest'], $0: 'node' },
    });
    expect(warnSpy.mock.calls[0][1]).toBe(
      'Jest has already enabled. You can remove jest.config.{ts,js}, then run this again to re-setup.',
    );
  });
});
