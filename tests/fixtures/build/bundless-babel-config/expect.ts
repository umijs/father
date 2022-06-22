export default (files: Record<string, string>) => {
  expect(files['cjs/index.js']).toContain('"replacedName"');
  expect(files['esm/index.js']).toContain('"replacedName"');
};
