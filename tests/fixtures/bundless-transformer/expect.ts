export default (files: Record<string, string>) => {
  // babel special
  expect(files['cjs/index.js']).toContain('exports.default');

  // esbuild special
  expect(files['esm/index.js']).toContain(' as default');
};
