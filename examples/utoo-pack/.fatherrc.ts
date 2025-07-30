import { defineConfig } from '../../dist';
const path = require('path');

export default defineConfig({
  umd: {
    bundler: 'utoopack',
    // bundler: 'webpack',
    generateUnminified: true,
    rootPath: path.resolve(__dirname, '../../'),
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
  platform: 'browser',
});
