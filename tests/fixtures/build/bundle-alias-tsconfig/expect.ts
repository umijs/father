export default (files: Record<string, string>) => {
  expect(files['umd/index.min.js']).toContain('"alias here"');
  expect(files['umd/index.min.js']).toContain('"other here"');
  expect(files['umd/index.min.js']).toContain('"hello here"');
  expect(files['umd/index.min.js']).toContain('"button here"');
  expect(files['umd/index.min.js']).toContain('"max here"');
  expect(files['umd/index.min.js']).toContain('"testUtils here"');
};
