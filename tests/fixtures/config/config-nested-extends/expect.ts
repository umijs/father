export default (files: Record<string, string>) => {
  // expect node platform
  expect(files['esm/index.js']).toContain("from 'fs';");

  // expect not esbuild
  expect(files['esm/index.js']).not.toContain(' as default');
};
