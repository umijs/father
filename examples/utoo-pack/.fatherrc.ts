import { defineConfig } from '../../dist';
const path = require('path');

export default defineConfig({
  umd: {
    bundler: 'utoo-pack',
    // bundler: 'webpack',
    generateUnminified: true,
    rootPath: path.resolve(__dirname, '../../'),
    name: 'utoo-pack-example',
    externals: {
      react: {
        root: 'React',
        commonjs: 'react',
      },
      'react-dom': {
        root: 'ReactDOM',
        commonjs: 'react-dom',
      },
    },
    alias: {
      'hello-a': './src/a.ts',
    },
  },
  platform: 'browser',
});
