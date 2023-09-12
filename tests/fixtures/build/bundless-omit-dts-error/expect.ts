export default (files: Record<string, string>) => {
  expect(Object.keys(files)).toEqual(['esm/index.js', 'esm/index.d.ts']);
};
