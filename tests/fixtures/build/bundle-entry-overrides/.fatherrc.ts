export default {
  umd: {
    entry: {
      'src/a': {
        define: {
          'process.env.NAME': JSON.stringify('A'),
        },
      },
      'src/b': {
        define: {
          'process.env.NAME': JSON.stringify('B'),
        },
      },
    },
  },
  define: {
    'process.env.NAME': JSON.stringify('0'),
  },
};
