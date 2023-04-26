export default (files: Record<string, string>) => {
  // expect namespace pefix
  expect(files['esm/index.js']).toContain('"some-lib-');
  expect(files['umd/some-lib.min.js']).toContain('"some-lib-');

  // expect auto set displayName
  expect(files['esm/index.js']).toContain('"Foo"');
  expect(files['umd/some-lib.min.js']).toContain('"Foo"');
};
