import { chalk, lodash } from '@umijs/utils';
import { IApi } from '../types';
import { logger } from '../utils';

export default (api: IApi) => {
  api.registerCommand({
    name: 'help',
    alias: 'h',
    description: 'show father usage',
    configResolveMode: 'loose',
    fn() {
      const subCommand = api.args._[0];
      if (subCommand) {
        if (subCommand in api.service.commands) {
          showHelp(api.service.commands[subCommand]);
        } else {
          logger.error(`Invalid sub command ${subCommand}.`);
        }
      } else {
        showHelps(api.service.commands);
      }
    },
  });
};

function showHelp(command: any) {
  console.log(
    [
      `\nUsage: father ${command.name}${command.options ? ` [options]` : ''}`,
      command.description ? `\n${chalk.gray(command.description)}.` : '',
      command.options ? `\n\nOptions:\n${padLeft(command.options)}` : '',
      command.details ? `\n\nDetails:\n${padLeft(command.details)}` : '',
    ].join(''),
  );
}

function showHelps(commands: IApi['service']['commands']) {
  console.log(`
Usage: father <command> [options]

Commands:
${getDeps(commands)}
`);
  console.log(
    `Run \`${chalk.bold(
      'father help <command>',
    )}\` for more information of specific commands.`,
  );
  console.log(
    `Visit ${chalk.bold(
      'https://github.com/umijs/father',
    )} to learn more about father.`,
  );
}

function getDeps(commands: any) {
  return Object.keys(commands)
    .map((key) => {
      return `    ${chalk.green(lodash.padEnd(key, 10))}${
        commands[key].description || ''
      }`;
    })
    .join('\n');
}

function padLeft(str: string) {
  return str
    .trim()
    .split('\n')
    .map((line: string) => `    ${line}`)
    .join('\n');
}
