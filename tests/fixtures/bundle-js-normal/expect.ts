export default (files: Record<string, string>) => {
  expect(files['umd/js-normal.min.js']).toContain('console.log');
};
