export default (files: Record<string, string>) => {
  // check normal extra externals
  expect(files['test/index.js']).toContain('require("minimatch")');
  expect(files['test/index.d.ts']).toContain("from 'minimatch'");

  // check targeted extra externals
  expect(files['test/index.js']).toContain('require("world")');
  expect(files['test/index.d.ts']).toContain("from 'world'");
};
