export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js']).toContain('"1.2.3"');
};
