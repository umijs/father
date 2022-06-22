export default (files: Record<string, string>) => {
  // cjs special
  expect(files['index.js']).toContain('__toCommonJS(');

  // esm special
  expect(files['client/index.js']).toContain(' as default');
};
