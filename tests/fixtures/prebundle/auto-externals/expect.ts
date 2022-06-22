export default (files: Record<string, string>) => {
  // check auto-external deps in package.json dependencies field
  expect(files['test/index.js']).toContain('require("minimatch")');
  expect(files['test/index.d.ts']).toContain("from 'minimatch'");
};
