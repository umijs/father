import { deepmerge, logger, yParser } from '@umijs/utils';
import { BUILD_COMMANDS, DEV_COMMAND } from '../constants';
import { Service } from '../service/service';
import {
  checkLocal,
  checkVersion as checkNodeVersion,
  setNoDeprecation,
  setNodeTitle,
} from './node';

interface IOpts {
  args?: yParser.Arguments;
  cwd?: string;
}

export async function run(_opts?: IOpts) {
  checkNodeVersion();
  checkLocal();
  setNodeTitle();
  setNoDeprecation();

  const args =
    _opts?.args ||
    yParser(process.argv.slice(2), {
      alias: {
        version: ['v'],
        help: ['h'],
      },
      boolean: ['version'],
    });
  const command = args._[0];

  if (command === DEV_COMMAND) {
    process.env.NODE_ENV = 'development';
  } else if (BUILD_COMMANDS.includes(command)) {
    process.env.NODE_ENV = 'production';
  }

  try {
    const service = new Service({ cwd: _opts?.cwd });

    await service.run2({
      name: command,
      args: deepmerge({}, args),
    });

    // handle restart for dev command
    if (command === DEV_COMMAND) {
      async function listener(data: any) {
        if (data?.type === 'RESTART') {
          // off self
          process.off('message', listener);

          // restart
          run({ args });
        }
      }

      process.on('message', listener);
    }
  } catch (e: any) {
    logger.error(e);
    process.exit(1);
  }
}
