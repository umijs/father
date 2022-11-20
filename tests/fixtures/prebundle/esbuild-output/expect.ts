export default (files: Record<string, string>) => {
  // check rollup dist
  expect(files['minimatch/index.js']).toContain('Minimatch');

  // check rollup declaration, handle export = syntax
  expect(files['minimatch/index.d.ts']).toContain('namespace');

  // check package.json
  expect(files['minimatch/package.json']).toContain('"name"');
  expect(files['minimatch/package.json']).toContain('"author"');
  expect(files['minimatch/package.json']).toContain('"license"');
};
