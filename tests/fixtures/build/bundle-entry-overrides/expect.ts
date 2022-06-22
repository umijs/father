export default (files: Record<string, string>) => {
  expect(files['umd/a.min.js']).toContain('"A"');
  expect(files['umd/b.min.js']).toContain('"B"');
};
