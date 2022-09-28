export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js']).toContain('color: red;');
};
