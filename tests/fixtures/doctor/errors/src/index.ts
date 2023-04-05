// @ts-nocheck
import orgAlias from '@org/alias';
import orgExternals from '@org/externals';
import alias from 'alias';
import path from 'child_process';
import externals from 'externals';
import hello from 'hello';
import BigCamelCase from './CamelCase';
import esm from 'esm';
import './index.less';

// to avoid esbuild tree-shaking
console.log(
  hello,
  alias,
  orgAlias,
  externals,
  orgExternals,
  path,
  BigCamelCase,
  esm,
);
