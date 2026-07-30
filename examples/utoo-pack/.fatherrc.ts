import { defineConfig } from '../../dist';
const path = require('path');

export default defineConfig({
  umd: {
    bundler: 'utoopack',
    // bundler: 'webpack',
    // Cover inline CSS with CSS Modules side effects.
    extractCSS: false,
    generateUnminified: true,
    name: 'utoo-pack-example',
    externals: {
      react: {
        root: 'React',
        commonjs: 'react',
        commonjs2: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs: 'react-dom',
        commonjs2: 'react-dom',
      },
    },
    alias: {
      'hello-a': './src/a.ts',
      'alias-module': path.join(__dirname, 'src/alias'),
    },
    copy: [
      {
        from: './src/reset.css',
        to: './reset.css',
      },
    ],
  },
  esm: {},
  cjs: {},
  dts: {
    compiler: 'tsgo',
  },
  platform: 'browser',
});
