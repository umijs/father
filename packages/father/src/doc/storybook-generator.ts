import { existsSync, ensureDirSync, writeFileSync, readFileSync } from 'fs-extra';
import { join } from 'path';
import { sync } from 'glob';
import winPath from 'slash2';

const STORYBOOK_FOLDER = '.storybook';

function getTitle(name: string) {
  return name
    .replace(/\b\w/g, function(v) {
      return v.toUpperCase();
    })
    .replace(/-/g, '');
}

function generateFiles(projectPath: string) {
  const pkg = require(join(projectPath, './package.json'));
  const tempStorybookPath = join(projectPath, STORYBOOK_FOLDER);

  // ===================================================================
  // =                              Story                              =
  // ===================================================================
  const importString = [];
  const importSourceString = [];
  const addString = [];

  // Get all files
  const files: string[] = sync(join(projectPath, 'examples/*.@(js|ts|jsx|tsx)'), {});

  // Get pure file name without prefix path & suffix
  const fileNames = files.map(fileName =>
    fileName
      .split('/')
      .pop()
      .replace(/\.(jsx?|tsx?)$/, ''),
  );

  // Group examples
  fileNames.forEach(fileName => {
    const ComponentName = getTitle(fileName);

    importString.push(`import ${ComponentName} from '../examples/${fileName}';`);
    importSourceString.push(
      `import ${ComponentName}Source from 'rc-source-loader!../examples/${fileName}';`,
    );

    addString.push(`.add('${fileName}', () => <${ComponentName} />,{
      source: {
        code: ${ComponentName}Source,
      },
    })`);
  });
  /**
   * 设置主题，默认还是白色的
   * 设置 STORYBOOK_THEME 即可变成黑色，
   * 这两种都是自带的
   */
  const theme = process.env.STORYBOOK_THEME || 'light';
  // Generate template
  const fileContent = `
/* eslint-disable import/no-webpack-loader-syntax */
import React from 'react';
import Markdown from 'react-markdown';
import { withA11y } from '@storybook/addon-a11y';
import { storiesOf, addParameters } from '@storybook/react';
import { withConsole } from '@storybook/addon-console';
${importSourceString.join('\n')}
${importString.join('\n')}

import { themes } from '@storybook/theming';

// Option defaults.
addParameters({
  options: {
    theme: themes.${theme},
    name: '${pkg.name}',
    url: '${pkg.homepage}',
    title:'${pkg.name}'
  },
});
import READMECode from '../README.md';


// add demo
storiesOf('${pkg.name}', module)
.addDecorator(withA11y) 
.addDecorator((storyFn, context) => withConsole()(storyFn)(context))
.add(
  'README',
  () => (
    <div
      className="markdown-body entry-content"
      style={{
        padding: 24,
      }}
    >
      <Markdown escapeHtml={false} source={READMECode} />
    </div>
  ),
  {
    source: {
      code: READMECode,
    },
  },
)
${addString.join('\n')}
`;

  // Write files
  const entryPath = winPath(join(tempStorybookPath, 'index.js'));
  ensureDirSync(tempStorybookPath);
  writeFileSync(entryPath, fileContent, 'utf8');

  // ===================================================================
  // =                              Frame                              =
  // ===================================================================
  const addOn = `
import '@storybook/addon-actions/register';
import '@storybook/addon-a11y/register';
import '@storybook/addon-console';
import 'storybook-addon-source/register';
`;

  const configJs = `
import { configure, addDecorator } from '@storybook/react';
import { withNotes } from '@storybook/addon-notes';
import { withOptions } from '@storybook/addon-options';
import withSource from 'storybook-addon-source';

function loadStories() {
  require('${entryPath}');
}

addDecorator(withNotes);
addDecorator(withSource);


configure(loadStories, module);`;

  const manageHeaderHtml = `
<script>
  // hackcode stroybook no support
  document.title = '${pkg.name.toUpperCase()}';
</script>
<link
  rel="icon"
  type="image/png"
  href="https://gw.alipayobjects.com/zos/rmsportal/rlpTLlbMzTNYuZGGCVYM.png"
/>
`;

  const previewHeaderHtml = `
  <link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/2.10.0/github-markdown.min.css"
/>
<style>
#root{
  background: #eee;
}
</style>
`;

  writeFileSync(join(tempStorybookPath, 'addons.js'), addOn);
  writeFileSync(join(tempStorybookPath, 'config.js'), configJs);
  writeFileSync(join(tempStorybookPath, 'manager-head.html'), manageHeaderHtml);
  writeFileSync(join(tempStorybookPath, 'preview-head.html'), previewHeaderHtml);

  // ===================================================================
  // =                             Webpack                             =
  // ===================================================================
  const webpackContent = `
module.exports = function(...args) {
  return require('${winPath(join(__dirname, 'storybook-webpack'))}')(...args);
};
`;
  writeFileSync(join(tempStorybookPath, 'webpack.config.js'), webpackContent);

  // ===================================================================
  // =                              Other                              =
  // ===================================================================
  const gitIgnorePath = join(projectPath, '.gitignore');
  let ignoreText = '';

  if (existsSync(gitIgnorePath)) {
    ignoreText = readFileSync(gitIgnorePath);
  }

  if (!ignoreText.includes(STORYBOOK_FOLDER)) {
    ignoreText = STORYBOOK_FOLDER + '\n' + ignoreText;
    writeFileSync(gitIgnorePath, ignoreText, 'utf8');
  }

  return {
    storybookPath: tempStorybookPath,
  };
}

export default generateFiles;
