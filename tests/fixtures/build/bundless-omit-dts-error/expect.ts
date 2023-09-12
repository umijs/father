export default (files: Record<string, string>) => {
  expect(Object.keys(files)).toEqual(['esm/index.d.ts', 'esm/index.js']);
};
