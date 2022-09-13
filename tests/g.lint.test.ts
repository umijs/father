import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import * as cli from '../src/cli/cli';
import { GeneratorHelper } from '../src/commands/generators/utils';

const mockInstall = jest.fn();
jest
  .spyOn(GeneratorHelper.prototype, 'installDeps')
  .mockImplementation(mockInstall);

const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

const CASES_DIR = path.join(__dirname, 'fixtures/generator');

describe('lint generator', () => {
  const eslintConfPath = path.join(CASES_DIR, '.eslintrc.js');
  const styleConfPath = path.join(CASES_DIR, '.stylelintrc');
  process.env.APP_ROOT = path.join(CASES_DIR);
  afterEach(() => {
    [eslintConfPath, styleConfPath].forEach((path) => {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    });
    writeFileSync(path.join(CASES_DIR, 'package.json'), '{}');
    warnSpy.mockReset();
  });

  describe('eslint', function () {
    test('g eslint', async () => {
      await cli.run({
        args: { _: ['g', 'eslint'], $0: 'node' },
      });

      const pkg = JSON.parse(
        readFileSync(path.join(CASES_DIR, 'package.json'), 'utf-8'),
      );

      expect(existsSync(eslintConfPath)).toBeTruthy();
      expect(pkg['scripts']).toMatchObject({
        'lint:es': 'eslint "{src,test}/**/*.{js,jsx,ts,tsx}"',
      });
      expect(pkg['devDependencies']).toMatchObject({
        '@umijs/lint': '^4',
        eslint: '^8.23.0',
      });
      expect(mockInstall).toBeCalled();
    });

    test('warning when eslint config exists', async () => {
      writeFileSync(eslintConfPath, '{}');
      await cli.run({
        args: { _: ['g', 'eslint'], $0: 'node' },
      });
      expect(warnSpy.mock.calls[0][1]).toBe(
        'ESLint has already enabled. You can remove .eslintrc, then run this again to re-setup.',
      );
    });
  });

  describe('stylelint', function () {
    test('g stylelint', async () => {
      await cli.run({
        args: { _: ['g', 'stylelint'], $0: 'node' },
      });

      const pkg = JSON.parse(
        readFileSync(path.join(CASES_DIR, 'package.json'), 'utf-8'),
      );

      expect(existsSync(styleConfPath)).toBeTruthy();
      expect(pkg['scripts']).toMatchObject({
        'lint:css': 'stylelint "{src,test}/**/*.{css,less}"',
      });
      expect(pkg['devDependencies']).toMatchObject({
        '@umijs/lint': '^4',
        stylelint: '^14.11.0',
      });
      expect(mockInstall).toBeCalled();
    });

    test('warning when stylelint config exists', async () => {
      writeFileSync(styleConfPath, '{}');
      await cli.run({
        args: { _: ['g', 'stylelint'], $0: 'node' },
      });
      expect(warnSpy.mock.calls[0][1]).toBe(
        'Stylelint has already enabled. You can remove .stylelintrc/stylelint.config.js, then run this again to re-setup.',
      );
    });
  });

  describe('lint', function () {
    test('g lint', async () => {
      await cli.run({
        args: { _: ['g', 'lint'], $0: 'node' },
      });

      const pkg = JSON.parse(
        readFileSync(path.join(CASES_DIR, 'package.json'), 'utf-8'),
      );

      expect(existsSync(styleConfPath)).toBeTruthy();
      expect(pkg['scripts']).toMatchObject({
        lint: 'pnpm run lint:es && pnpm run lint:css',
      });
      expect(pkg['devDependencies']).toMatchObject({
        '@umijs/lint': '^4',
        eslint: '^8.23.0',
        stylelint: '^14.11.0',
      });
      expect(mockInstall).toBeCalled();
    });
  });
});
