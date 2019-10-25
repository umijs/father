import * as assert from 'assert';
import { fork } from 'child_process';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { sync as mkdirp } from 'mkdirp';
import { DocProps } from '.';

// userConfig 是从 Bigfish 过来的，用于传入额外的配置信息
// 这部分信息需要写入到临时文件，因为在 doczrc.ts 里无法读取到他
// TODO: userConfig 无法用函数
export function devOrBuild({ cwd, cmd, params, userConfig = {}, DOC_PATH }: DocProps) {
  process.chdir(cwd);

  mkdirp(join(cwd, '.docz'));
  writeFileSync(
    join(cwd, '.docz', '.fatherrc.json'),
    JSON.stringify(userConfig, null, 2),
    'utf-8',
  );

  return new Promise((resolve, reject) => {
    const binPath = require.resolve('docz/bin/index.js');
    assert.ok(
      !params.includes('--config'),
      `
Don't use --config, config under doc in .fatherrc.js

e.g.

export default {
  doc: {
    themeConfig: { mode: 'dark' },
  },
};
      `.trim(),
    );

    // test 时走 src/doc.ts，这时没有 doczrc.js
    if (__dirname.endsWith('src')) {
      params.push('--config', join(__dirname, '../../lib/doczrc.js'));
    } else {
      params.push('--config', join(__dirname, 'doczrc.js'));
    }

    if (!params.includes('--port') && !params.includes('-p')) {
      params.push('--port', '8001');
    }
    if (process.env.HOST && !params.includes('--host')) {
      params.push('--host', process.env.HOST);
    }
    if (params.includes('-h')) {
      params.push('--help');
    }
    if (params.every(param => !param.includes('--dest'))) {
      params.push('--dest', DOC_PATH);
    }
    const child = fork(binPath, [cmd, ...params], {
      cwd,
      env: process.env,
    });
    child.on('exit', code => {
      if (code === 1) {
        reject(new Error('Doc build failed'));
      } else {
        resolve();
      }
    });
  });
}
