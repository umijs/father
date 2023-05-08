import { logger as umiLogger } from '@umijs/utils';
import { logger } from '../src/utils';

vi.mock('@umijs/utils', async () => {
  const originalModule = await vi.importActual('@umijs/utils');

  return {
    ...originalModule,
    logger: {
      ...originalModule.logger,
      info: vi.fn(),
    },
  };
});

afterAll(() => {
  vi.unmock('@umijs/utils');
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
});
