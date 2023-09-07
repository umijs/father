export default (files: Record<string, string>) => {
  // expect global types to be included
  expect(files['esm/index.d.js']).toContain(': string;');
};
