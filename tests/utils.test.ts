import { logger as umiLogger } from '@umijs/utils';
import {
  getDepPkgName,
  isBuiltInModule,
  isFilePath,
  logger,
} from '../src/utils';

jest.mock('@umijs/utils', () => {
  const originalModule = jest.requireActual('@umijs/utils');

  return {
    ...originalModule,
    logger: {
      ...originalModule.logger,
      info: jest.fn(),
    },
  };
});

afterAll(() => {
  jest.unmock('@umijs/utils');
});

describe('logger', () => {
  test('normal', () => {
    logger.info('normal');
    expect(umiLogger.info).toBeCalledWith('normal');
  });

  test('quiet only', () => {
    logger.setQuiet(false);
    logger.quietOnly.info('quiet only');
    expect(umiLogger.info).not.toBeCalledWith('quiet only');

    logger.setQuiet(true);
    logger.quietOnly.info('quiet only');
    expect(umiLogger.info).toBeCalledWith('quiet only');
  });

  test('quiet expect', () => {
    logger.setQuiet(false);
    logger.quietExpect.info('quiet expect');
    expect(umiLogger.info).toBeCalledWith('quiet expect');

    logger.setQuiet(true);
    logger.quietExpect.info('quiet expect');
    expect(umiLogger.info).toBeCalledWith('quiet expect');
  });

  test('prefix time', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    logger.info('prefix time');
    expect(umiLogger.info).toBeCalledWith(
      expect.stringMatching(/(\d{2}:){2}\d{2}/),
      'prefix time',
    );

    process.env.NODE_ENV = originalEnv;
  });

  describe(isFilePath.name, () => {
    test('absolute', () => {
      expect(isFilePath('/path/to/name')).toBe(true);
    });

    test('relative', () => {
      expect(isFilePath('./name/test')).toBe(true);
    });

    test('module', () => {
      expect(isFilePath('name')).toBe(false);
      expect(isFilePath('@scope/name')).toBe(false);
    });
  });

  describe(getDepPkgName.name, () => {
    test('normal module', () => {
      expect(getDepPkgName('name', { name: 'test' })).toBe('name');
      expect(getDepPkgName('name/test', { name: 'test' })).toBe('name');
    });

    test('scope module', () => {
      expect(getDepPkgName('@scope/name', { name: 'test' })).toBe(
        '@scope/name',
      );
      expect(getDepPkgName('@scope/name/test', { name: 'test' })).toBe(
        '@scope/name',
      );
    });

    test('absolute', () => {
      expect(getDepPkgName('/path/to/name', { name: 'test' })).toBe('test');
    });

    test('relative', () => {
      expect(getDepPkgName('./name/test', { name: 'test' })).toBe('test');
    });
  });

  test(isBuiltInModule.name, () => {
    expect(isBuiltInModule('node:path')).toBeTruthy();
    expect(isBuiltInModule('path')).toBeTruthy();
    expect(isBuiltInModule('minimatch')).toBeFalsy();
  });
});
