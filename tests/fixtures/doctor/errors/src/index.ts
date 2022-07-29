// @ts-nocheck
import orgAlias from '@org/alias';
import orgExternals from '@org/externals';
import alias from 'alias';
import externals from 'externals';
import hello from 'hello';
import './index.less';

// to avoid esbuild tree-shaking
console.log(hello, alias, orgAlias, externals, orgExternals);
