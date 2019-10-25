import chalk from 'chalk';

const colors = [
  'bgBlack',
  'bgRed',
  'bgGreen',
  'bgYellow',
  'bgBlue',
  'bgMagenta',
  'bgCyan',
  'bgWhite',
  'bgBlackBright',
  'bgRedBright',
  'bgGreenBright',
  'bgYellowBright',
  'bgBlueBright',
  'bgMagentaBright',
  'bgCyanBright',
  'bgWhiteBright',
];

let index = 0;
const cache = {};

export default function (pkg) {
  if (!cache[pkg]) {
    const color = colors[index];
    let str = chalk[color](pkg);
    if (color.includes('Bright') || ['bgWhite', 'bgYellow', 'bgCyan'].includes(color)) {
      str = chalk.black(str);
    }
    cache[pkg] = str;
    if (index === colors.length - 1) {
      index = 0;
    } else {
      index += 1;
    }
  }
  return cache[pkg];
}
