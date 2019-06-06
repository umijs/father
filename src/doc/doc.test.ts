import { join } from 'path';
import { existsSync, renameSync } from 'fs';
import { devOrBuild } from './';

xdescribe('father doc build', () => {
  process.env.COMPRESS = 'none';
  require('test-build-result')({
    root: join(__dirname, '../fixtures/doc'),
    build({ cwd }) {
      return devOrBuild({ cwd, cmd: 'build', params: [], docConfig: {} } as any).then(() => {
        const absDirPath = join(cwd, '.doc');
        if (existsSync(absDirPath)) {
          renameSync(absDirPath, join(cwd, 'dist'));
        } else {
          throw new Error(`.doc not exists`);
        }
      });
    },
  });
});
