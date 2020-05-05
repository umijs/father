import { dirname, join } from 'path';
import { IServiceOpts, Service as CoreService } from '@umijs/core';

class Service extends CoreService {
  constructor(opts: IServiceOpts) {
    process.env.FATHER_VERSION = require('../package').version;
    process.env.FATHER_DIR = dirname(require.resolve('../package'));

    super({
      ...opts,
      presets: [
        require.resolve('father-preset-built-in'),
        ...(opts.presets || []),
      ],
    });
  }
}

export { Service };
