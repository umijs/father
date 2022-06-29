export default (files: Record<string, string>) => {
  // check assets file copy
  expect(files['test/hello.js']).not.toBeUndefined();

  // check assets path relocation
  expect(files['test/index.js']).toContain('"hello.js"');
};
