export default (files: Record<string, string>) => {
  expect(files['cjs/index.js']).toContain('await');
  expect(files['esm/index.js']).toContain('_regeneratorRuntime');
};
