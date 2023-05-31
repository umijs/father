export default (files: Record<string, string>) => {
  expect(files['cjs/ignore.d.ts']).not.toBeUndefined();
};
