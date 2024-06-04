export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js'].replace(/\s+/g, '')).toContain('color:red');
};
