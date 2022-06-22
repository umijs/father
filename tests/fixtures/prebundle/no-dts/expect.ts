export default (files: Record<string, string>) => {
  expect(files['rimraf/index.js']).not.toBeUndefined();
  expect(files['rimraf/index.d.ts']).toBeUndefined();
};
