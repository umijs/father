export default (files: Record<string, string>) => {
  expect(files['cjs/index.js']).toContain('"1.2.3"');
  expect(files['esm/index.js']).toContain('"1.2.3"');
};
