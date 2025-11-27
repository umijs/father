export default (files: Record<string, string>) => {
  expect(files['esm/index.js']).toContain('base-plugin-1');
  expect(files['esm/index.js']).toContain('child-plugin-1');
  expect(files['esm/index.js']).toContain('plugin-from-preset');
};
