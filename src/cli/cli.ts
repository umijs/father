import { logger, yParser } from '@umijs/utils';
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
  try {
    await new Service({ cwd: _opts?.cwd }).run2({
      name: command,
      args,
    });
  } catch (e: any) {
    logger.error(e);
    process.exit(1);
  }
}
