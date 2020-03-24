import { join, dirname } from 'path';
import fs from 'fs';

const cwd = process.cwd();

function getEsPathFromLib(path) {
  if (/\/lib\//.test(path)) {
    const esModule = path.replace('/lib/', '/es/');
    const esPath = dirname(join(cwd, `node_modules/${esModule}`));

    if (fs.existsSync(esPath)) {
      console.log(`[es build] replace ${path} with ${esModule}`);
      path = esModule;
    }
  }

  return path;
}

function replacePath(path) {
  if (path.node.source) {
    path.node.source.value = getEsPathFromLib(path.node.source.value);
  }
}

function replaceLib() {
  return {
    visitor: {
      ImportDeclaration: replacePath,
      ExportNamedDeclaration: replacePath,
      // resolve require statement for gulp-ts pipe
      CallExpression(path) {
        if (
          path.node.callee &&
          path.node.callee.name === 'require' &&
          path.node.arguments &&
          path.node.arguments[0]
        ) {
          path.node.arguments[0].value = getEsPathFromLib(path.node.arguments[0].value);
        }
      },
    },
  };
}

export default replaceLib;
