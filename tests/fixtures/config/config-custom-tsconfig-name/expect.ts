export default (files: Record<string, string>) => {
  expect(files['cjs/index.d.ts']).not.toBeUndefined();
  expect(files['cjs/exclude/index.d.ts']).toBeUndefined();
};
