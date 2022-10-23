import path from 'path';

export default {
  esm: { transformer: 'swc' },
  cjs: { transformer: 'swc' },
  alias: {
    '@': path.join(__dirname, 'src'),
    '@umi/config': path.join(__dirname, 'src/hello.config.ts'),
    '@umi/foo': path.join(__dirname, 'src/foo.tsx'),
    '@umi/bar': path.join(__dirname, 'src/bar.jsx'),
    '@test': path.join(__dirname, 'src/packages/test'),
    '@testi': path.join(__dirname, 'src/packages/test'),
  },
};
