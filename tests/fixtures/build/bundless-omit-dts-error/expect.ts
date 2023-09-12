export default (files: Record<string, string>) => {
  expect(Object.keys(files)).toEqual(['index.js', 'index.d.ts']);
};
