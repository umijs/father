export default (files: Record<string, string>) => {
  // node special
  expect(files['cjs/index.js']).toContain('__toCommonJS(');

  // browser special
  expect(files['cjs/client/index.js']).toContain('@babel/runtime');
};
