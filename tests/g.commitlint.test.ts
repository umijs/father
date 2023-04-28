import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import path from 'path';
import * as cli from '../src/cli/cli';
import { GeneratorHelper } from '../src/commands/generators/utils';

const mockInstall = jest.fn();
jest
  .spyOn(GeneratorHelper.prototype, 'installDeps')
  .mockImplementation(mockInstall);

const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
const mockExecSync = jest.fn();
jest.doMock('child_process', () => {
  const originalModule = jest.requireActual('child_process');
  return {
    __esModule: true,
    ...originalModule,
    execSync: mockExecSync,
  };
});

const CASES_DIR = path.join(__dirname, 'fixtures/generator');

describe('lint generator', () => {
  const commitlintConfPath = path.join(CASES_DIR, 'commitlint.config.js');
  process.env.APP_ROOT = path.join(CASES_DIR);

  beforeAll(() => {
    const git = path.join(CASES_DIR, '.git');
    if (!existsSync(git)) {
      mkdirSync(path.join(CASES_DIR, '.git'));
    }
  });

  afterEach(() => {
    if (existsSync(commitlintConfPath)) {
      unlinkSync(commitlintConfPath);
    }
    writeFileSync(path.join(CASES_DIR, 'package.json'), '{}\n', 'utf-8');
    warnSpy.mockReset();
  });

  test('g commitlint', async () => {
    await cli.run({
      args: { _: ['g', 'commitlint'], $0: 'node' },
    });

    const pkg = JSON.parse(
      readFileSync(path.join(CASES_DIR, 'package.json'), 'utf-8'),
    );

    expect(pkg['commitlint']).toMatchObject({
      extends: ['@commitlint/config-conventional'],
    });
    expect(pkg['scripts']).toMatchObject({
      prepare: 'husky install',
    });
    expect(pkg['devDependencies']).toMatchObject({
      '@commitlint/cli': '^17.1.2',
      '@commitlint/config-conventional': '^17.1.0',
      husky: '^8.0.1',
    });
    expect(mockInstall).toBeCalled();
    expect(mockExecSync).toBeCalledWith(
      `pnpm husky add .husky/commit-msg 'pnpm commitlint --edit $1'`,
    );
  });

  test('warning when commitlint config exists', async () => {
    writeFileSync(commitlintConfPath, '{}');
    await cli.run({
      args: { _: ['g', 'commitlint'], $0: 'node' },
    });
    expect(warnSpy.mock.calls[0][1]).toBe(
      'Commitlint has already enabled. You can remove commitlint config, then run this again to re-setup.',
    );
    unlinkSync(commitlintConfPath);
  });

  test('warning when not used in git repo', async () => {
    rmdirSync(path.join(CASES_DIR, '.git'));
    await cli.run({
      args: { _: ['g', 'commitlint'], $0: 'node' },
    });
    expect(warnSpy.mock.calls[0][1]).toBe(
      'Only available for git project, exit',
    );
  });
});
