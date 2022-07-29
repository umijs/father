import { chalk } from '@umijs/utils';
import doctor, { registerRules } from '../doctor';
import { IApi } from '../types';

function getSummaryLog(summary: { error: number; warn: number }) {
  const color = summary.error ? chalk.red : chalk.yellow;
  const total = summary.error + summary.warn;

  return color.bold(`
💊 ${total} problems (${summary.error} errors ${summary.warn} warnings)`);
}

export default (api: IApi) => {
  registerRules(api);

  api.registerCommand({
    name: 'doctor',
    description: 'check your project for potential problems',
    async fn() {
      const report = await doctor(api);
      const summary = { error: 0, warn: 0 };

      report
        .sort((p) => (p.type === 'error' ? -1 : 1))
        .forEach((item) => {
          summary[item.type] += 1;
          console.log(`
${chalk[item.type === 'error' ? 'red' : 'yellow'](
  `${item.type.toUpperCase()}`.padStart(8),
)} ${item.problem}
${chalk.green('SOLUTION')} ${item.solution}`);
        });

      if (summary.error || summary.warn) {
        console.log(getSummaryLog(summary));

        if (summary.error) {
          process.exit(1);
        }
      } else {
        console.log(chalk.bold.green('🎉 This project looks fine!'));
      }
    },
  });
};
