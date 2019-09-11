
export default {
  esm: { type: 'rollup' },
  extraExternals: [
    'foo',
  ],
  externalsExclude: [
    'foo/bar',
  ],
};
