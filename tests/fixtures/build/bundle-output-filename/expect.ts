export default (files: Record<string, string>) => {
  expect(files['abc/index.umd.min.js']).not.toBeUndefined();
};
